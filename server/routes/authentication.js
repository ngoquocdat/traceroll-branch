"use strict";
(function(Auth) {


	var passport = require('passport'),
		passportLocal = require('passport-local').Strategy,
		nconf = require('nconf'),
		winston = require('winston'),
		async = require('async'),
		validator = require('validator'),
		express = require('express'),
		randomString = require('randomstring'),

		Password = require('../controllers/password'),
		user = require('../models/users'),
		db = require('../database/mongo'),
		hotswap = require('./../controllers/hotswap'),
		utils = require('../../public/js/utils'),
		nodeMailer = require('nodemailer'),
		moment = require('moment'),
		helpers = require('../models/helpers'),
		meta = {config:{}},
		loginStrategies = [];


	Auth.initialize = function(app, middleware) {
		app.use(passport.initialize());
		app.use(passport.session());

		app.use(function(req, res, next) {

			req.uid = req.user ? parseInt(req.user.uid, 10) : 0;
			next();
		});

		Auth.app = app;
		Auth.middleware = middleware;
	};

	Auth.getLoginStrategies = function() {
		return loginStrategies;
	};

	Auth.reloadRoutes = function(callback) {
		var router = express.Router();
		router.hotswapId = 'auth';

		loginStrategies.length = 0;
		passport.use(new passportLocal({passReqToCallback: true}, Auth.login));

		loginStrategies.forEach(function(strategy) {

			if (strategy.url) {
				router.get(strategy.url, passport.authenticate(strategy.name, {
					scope: strategy.scope
				}));
			}

			router.get(strategy.callbackURL, passport.authenticate(strategy.name, {
				successReturnToOrRedirect: nconf.get('relative_path') + '/',
				failureRedirect: nconf.get('relative_path') + '/login'
			}));
		});

		router.post('/logout', logout);
		router.post('/register', register);
		router.post('/login',login);
		
		router.post('/editUser',edit);
		router.post('/reset-pwd', resetPwd);
		router.post('/user/recover-password/isExpired', checkExpiredEmail);
		router.post('/user/recover-password', recoverPassword);

		hotswap.replace('auth', router);
		if (typeof callback === 'function') {
			callback();
		}
	};

	Auth.login = function(req, username, password, next) {
		if (!username || !password) {
			return next(new Error('[[error:invalid-password]]'));
		}

		winston.info('Auth.login');
		var userslug = utils.slugify(username);
		winston.info('userslug: ' + userslug);
		var uid, userData = {};

		async.waterfall([
			function(next) {
				winston.info('Getting user id by user slug')
				user.getUidByUserslug(userslug, next);
			},
			function(_uid, next) {
				winston.info('ipAdress: ', req.ip);
				if (!_uid) {
					return next(new Error('User not found'));
				}
				uid = _uid;
				next();
				
				winston.info('userId: ' + uid);
			},
			function(next) {
				winston.info('Getting user data...')
				async.parallel({
					userData: function(next) {
						db.getObjectFields('user:' + uid, ['password', 'email', 'picture','firstname','lastname', 'username'], next);
					},
					isAdmin: function(next) {
						user.isAdministrator(uid, next);
					},
					isAgent: function(next) {
						user.isAgent(uid, next);
					}
				}, next);
			},
			function(result, next) {
				userData = result.userData;
				userData.uid = uid;
				userData.isAdmin = result.isAdmin;
				userData.isAgent = result.isAgent;
				if (!result.isAdmin && parseInt(meta.config.allowLocalLogin, 10) === 0) {
					return next(new Error('[[error:local-login-disabled]]'));
				}

				if (!userData || !userData.password) {
					return next(new Error('[[error:invalid-user-data]]'));
				}
				if (userData.banned && parseInt(userData.banned, 10) === 1) {
					return next(new Error('[[error:user-banned]]'));
				}
				Password.compare(password, userData.password, next);
			},
			function(passwordMatch, next) {
				if (!passwordMatch) {
					return next(new Error('Password incorrect'));
				}
				winston.info('Password matched');
				user.auth.clearLoginAttempts(uid);
				var status = 'online';
				db.setObjectField('user:'+uid,'status',status,function (err,result){

				})
				next(null, userData, '[[success:authentication-successful]]');
			}
		], next);
	};

	passport.serializeUser(function(user, done) {
		done(null, user.uid);
	});

	passport.deserializeUser(function(uid, done) {
		done(null, {
			uid: uid
		});
	});

	function login(req, res, next) {
		
		console.log('=================================== Authentication req.session: ', req.session);

		if (req.body.hasOwnProperty('returnTo') && !req.session.returnTo) {
			req.session.returnTo = req.body.returnTo;
		}

		var loginWith = 'username-email-facebook';

		if (req.body.username && utils.isEmailValid(req.body.username) && loginWith.indexOf('email') !== -1) {
			user.getUsernameByEmail(req.body.username, function(err, username) {
				if (err) {
					return next(err);
				}
				req.body.username = username ? username : req.body.username;
				Auth.continueLogin(req, res, next);
			});
		} else if (loginWith.indexOf('username') !== -1 && !validator.isEmail(req.body.username)) {
			winston.info('login with username');
			Auth.continueLogin(req, res, next);
		} else {
			res.status(500).send('[[error:wrong-login-type-' + loginWith + ']]');
		}
	}

	Auth.continueLogin = function(req, res, next) {
		winston.info('continuteLogin....');
		passport.authenticate('local', function(err, userData, info) {
			winston.info('in passport.authenticate');
			if (err) {
				winston.error('err: ' + err.message);
				return res.status(403).send(err.message);
			}
			winston.info('userData: ' + JSON.stringify(userData));
			if (!userData) {
				if (typeof info === 'object') {
					info = 'user-password-incorrect';
				}

				return res.status(403).send(info);
			}

			var passwordExpiry = userData.passwordExpiry !== undefined ? parseInt(userData.passwordExpiry, 10) : null;
			console.log(passwordExpiry);
			// Alter user cookie depending on passed-in option
			if (req.body.remember === 'on') {
				var duration = 1000*60*60*24*parseInt(meta.config.loginDays || 365, 10);
				req.session.cookie.maxAge = duration;
				req.session.cookie.expires = new Date(Date.now() + duration);
			} else {
				var loginExpiry = 1000*60*60*24*parseInt(meta.config.loginDays || 365, 10);
				console.log('========================== LoginExpiry', new Date(Date.now() + loginExpiry));
				req.session.cookie.maxAge = loginExpiry;
				req.session.cookie.expires = new Date(Date.now() + loginExpiry);

			}

			if (passwordExpiry && passwordExpiry < Date.now()) {

				winston.verbose('[auth] Triggering password reset for uid ' + userData.uid + ' due to password policy');
				req.session.passwordExpired = true;
				user.reset.generate(userData.uid, function(err, code) {

					res.status(200).send(nconf.get('relative_path') + '/reset/' + code);
				});
			} else {

				req.login({
					uid: userData.uid

				}, function(err) {

					if (err) {
						return res.status(200).send(err.message);
					}
					if (userData.uid) {
						console.log('LogIP: ' + req);
						user.logIP(userData.uid, req.ip);

					}
					var userObj;

					if (!req.session.returnTo) {

						console.log('relative_path: ' + nconf.get('relative_path'));
						user.getUsers([userData.uid], function (err, data) {
								userObj = data[0];
								res.status(200).send(userObj);
						});


					} else {
						var next = req.session.returnTo;
						delete req.session.returnTo;
						user.getUsers([userData.uid], function (err, data) {
								userObj = data[0];
								userObj.returnTo = next;

								res.status(200).send(userObj);
							});
					}
				});
			}

		})(req, res, next);
	};

	function sendRegisterConfirmEmail(regisData, next){
		if(!regisData.email){
			return next(new Error('Can not send none email register.'));
		}else{
			const urlClient = nconf.get("url");
			const regisEmail = regisData.email;
			const regisFullName = regisData.fullname;
			var now = Date.now();
			var tokenRandom = randomString.generate({
				length: 32
			})

			async.parallel([
				/*CREATE OBJ TOKEN*/
				function(next_parallel){

					db.sortedSetAdd('token:'+tokenRandom+':non-registration', now, regisEmail, next_parallel);
				}
			], function(err){
				if(err){
					next(new Error(err));
				}else{

					/*ACTION SEND EMAIL*/
					let transporter = nodeMailer.createTransport({
						host: 'smtp.gmail.com',
						port: 465,
						secure: true,
						auth: nconf.get('auth-sender')
					});

					let mailOptions = {
						from: 'Traceroll <'+(nconf.get('auth-sender')).user+'>', // sender address
						to: regisEmail, // list of receivers
						subject: 'Welcome to Traceroll', // Subject line
						text: 'Welcome to Traceroll', // plain text body
						html: `<style>@font-face {
						 font-family: "AvenirNext-Regular";
						 src: url("/fonts/avenirnext/AvenirNextLTPro-Regular.woff") format("woff"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.otf") format("opentype"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.ttf") format("truetype"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.svg#svgFontName") format("svg");
						 font-family: "AvenirNext-Bold";a,img{border:none;}</style><img src="https://s3.amazonaws.com/traceroll-bucket/Logo/email_banner.png" width="300"/><br /><p><b>Hello `+regisFullName.toString()+`,</b><br /><br />
						<b>Thank you for signing up to Traceroll.<br /><br />
						If you haven't started, <a href="`+urlClient+`/login"> click here</a> to start exploring Traceroll.</b></p>
						<p><b>If this is not you <a href="`+urlClient+`/user/non-regis/`+tokenRandom+`">click here</a> to delete this account.</a></b></p><br /><img src="https://s3.amazonaws.com/traceroll-bucket/Logo/email-end.png" width="600" />`// template email
					};

					transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							winston.error(error)
							next(err);
						}
						next();
						winston.info('Send report success - message %s sent: %s', info.messageId, info.response);
					});
				}
			})
		}

	}

	function register(req, res) {
		if (parseInt(meta.config.allowRegistration, 10) === 0) {
			return res.sendStatus(403);
		}

		var userData = {};

		for (var key in req.body) {
			if (req.body.hasOwnProperty(key)) {
				userData[key] = req.body[key];
			}
		}
		winston.info(userData);
		var uid;
		async.waterfall([
			function(next) {
				if (!userData.email) {
					next(new Error('Invalid email'));
				}
				else if (!userData.username || userData.username.length < 3/*meta.config.minimumUsernameLength*/) {
					next(new Error('Username too short'));
				}
				else if (userData.username.length > 20/*meta.config.maximumUsernameLengt*/) {
					next(new Error('Username too long'));
				}
				else if (!userData.password || userData.password.length < 3/*meta.config.minimumPasswordLength*/) {
					next(new Error('Password too short'));
				}
				else if(userData.email) {
					db.getSortedSetByValue('email:uid', userData.email, function(err, results){
                        if(err){
                            next(new Error('Error when find user email'));
                        }
                        else if(results.length > 0){
                            next(new Error('Registration email already exists'));
						}
						else {
							next(null,userData)
						}
                    })
				}
				else if (userData.fbID) {
					db.getSortedSetByValue('fbid:uid', userData.fbID, function(err, results){
						if(err){
							next(new Error('Error when find user Facebook ID'));
						}
						else if(results.length > 0){
							next(new Error('Facebook ID already exists'));
						}
						else {
							next(null,userData)
						}
					})
				}
                else {
					next(null,userData);
				}
			},
			function(data, next) {
				user.create(data, next);
			},
			function(_uid, next) {

				uid = _uid;
				req.login({uid: uid}, next);
			},
			function(next) {
				
				next()
			}
		], function(err, data) {

			if (err) {
				res.status(400).send(err.message)
			}
			else {
				sendRegisterConfirmEmail(req.body, function(err) {
					if(err) {
						res.status(400).send(new Error(err))
					}
					else {
						user.getUsers([uid], function (err, data) {
							if(err) {
								res.status(400).send(new Error(err))
							}
							else {
								var userObj = data[0];
								console.log(userObj)
								res.status(200).send(userObj);
							}
						})
					}
				})
			}
		})
	}

	function edit(req, res) {


		if (parseInt(meta.config.allowRegistration, 10) === 0) {
			return res.sendStatus(403);
		}

		var userData = {};

		for (var key in req.body) {
			if (req.body.hasOwnProperty(key)) {
				userData[key] = req.body[key];
			}
		}
		var uid;
		async.waterfall([
			function(next) {
				if (!userData.email) {
					return next(new Error('Invalid email'));
				}

				if (!userData.username || userData.username.length < 3/*meta.config.minimumUsernameLength*/) {
					return next(new Error('Username too short'));
				}

				if (userData.username.length > 20/*meta.config.maximumUsernameLengt*/) {
					return next(new Error('Username too long'));
				}

				if (!userData.password || userData.password.length < 3/*meta.config.minimumPasswordLength*/) {
					return next(new Error('Password too short'));
				}

				next(null,userData);
			},
			function(data, next) {

				user.edit(data, next);
			},
			function(_uid, next) {

			//id = _uid;
				//req.login({uid: uid}, next);

				next();
			},
			function(next) {
				//user.logIP(uid, req.ip);

				//user.notifications.sendWelcomeNotification(uid);

				//plugins.fireHook('filter:register.complete', {uid: uid, referrer: req.body.referrer}, next);
				//console.log(req.body.referrer);
				next()
			}
		], function(err, data) {

			if (err) {
				return res.status(400).send(err.message);
			}
			res.status(200).send(nconf.get('relative_path') + '/administration');

		});
	}


	function logout(req, res, next) {
		var status = 'offline';
		const uid = req.user.uid;
		if (parseInt(uid, 10) > 0 && req.sessionID) {
			db.setObjectField('user:'+ uid,'status',status,function (err,result){

			})
			user.updateOnlineUsers(uid,function(err) {
				if (err) {
					return next(err);
				}
			});
			user.updateLastOnlineTime(uid,function(err) {
				if (err) {
					return next(err);
				}
			});
			db.sessionStore.destroy(req.sessionID, function(err) {
				if (err) {
					return next(err);
				}
				req.session.destroy();
				req.user = null;
				res.status(200).send('');
			});


		} else {
			db.setObjectField('user:'+ uid,'status',status,function (err,result){

			})
			user.updateOnlineUsers(uid,function(err) {
				if (err) {
					return next(err);
				}
			});
			user.updateLastOnlineTime(uid,function(err) {
				if (err) {
					return next(err);
				}
			});
			res.status(200).send('');
		}
	}

	function resetPwd(req, res, next){
		// console.log('resetPwd ===========', req.body);
		const recoverEmail = req.body.email;
		const now = Date.now();
		var urlClient = nconf.get("url");
		var stringRandom = randomString.generate({
			length: 32
		})
		/* CHECK RECOVER EMAIL IS EXIST*/
		db.sortedSetRank("email:uid", recoverEmail.toString(), function(err, results){
			// console.log('=============== sortedSetRank ================', err, results);
			if(err){
				res.json({
					error: err,
					message: "Error, can not check is exist recover email"
				})
			}else{
				async.waterfall([
					/*DELETE OLD RECOVER EMAIL BEFORE SEND NEW*/
					function(next_para){
						db.getSortedSetRange('recoveremail:'+recoverEmail, 0, -1, function(err, arrayTokens){
							if(err){
								winston.info('Error get recover email array tokens');
								next_para(err);
							}else{
								winston.info('First time recover password');
								next_para(null, arrayTokens);
							}
						})
					},

					function(arrayTokens, next_para){
						// console.log('============= arrayTokens: ', arrayTokens);
						if(!arrayTokens){
							// console.log('============= arrayTokens empty');
							next_para();
						}else{
							const _keys = helpers.buildKeys('token', arrayTokens, 'email');

							async.parallel([
								function(next_para_step){
									db.deleteAll(_keys, next_para_step);
								},

								function(next_para_step){
									db.delete('recoveremail:'+recoverEmail, next_para_step);
								}
							], function(err){
								if(err){
									winston.info('Error delete old temp recover password');
									next_para(err);
								}else{
									winston.info('Deleted old temp recover password');
									next_para();
								}
							})
						}
					}
				], function(err){
					if(err){
						// console.log('=============== Error when delete temp recover email ================');
						res.json({
							error: new Error('Error when delete old temp recover email'),
						})
					}else{
						/*SEND RECOVER EMAIL IF EMAIL FOUND*/
						if(results !== null){
							// console.log('=============== Recover email exist ================');
							async.parallel([
								function(next_parallel){
									db.sortedSetAdd('token:'+stringRandom+':email', now, recoverEmail, next_parallel);
								},
								function(next_parallel){
									db.sortedSetAdd('recoveremail:'+recoverEmail, now, stringRandom, next_parallel);
								}

							], function(err){
								if(err){
									next(new Error(err));
								}else{
									/*ACTION SEND EMAIL*/
									let transporter = nodeMailer.createTransport({
										host: 'smtp.gmail.com',
										port: 465,
										secure: true,
										auth: nconf.get('auth-sender')
									});

									let mailOptions = {
										from: 'Traceroll <'+(nconf.get('auth-sender')).user+'>', // sender address
										to: recoverEmail, // list of receivers
										subject: 'Password Reset Request for Traceroll', // Subject line
										text: 'Traceroll reset account password', // plain text body
										html: `<style>@font-face { font-family: "AvenirNext-Regular";
										 src: url("/fonts/avenirnext/AvenirNextLTPro-Regular.woff") format("woff"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.otf") format("opentype"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.ttf") format("truetype"), url("/fonts/avenirnext/AvenirNextLTPro-Regular.svg#svgFontName") format("svg");
										 font-family: "AvenirNext-Bold";a,img{border:none;}</style><img src="https://s3.amazonaws.com/traceroll-bucket/Logo/email_banner.png" width="300"/><br /><p><b>We have received your request to reset your password for the Traceroll account. To complete this request, simply </b><a href="`+urlClient+'/reset/password/'+stringRandom+'">click here to reset password</a>.</p>' // template email
									};

									transporter.sendMail(mailOptions, (error, info) => {
										if (error) {
											winston.error(error)
										  	res.json({error: error});
										}
										res.json({error: null});
										winston.info('Send report success - message %s sent: %s', info.messageId, info.response);
									});
								}
							})
						}else{
							/*RECOVER EMAIL NOT EXIST*/
							console.log('=============== Recovery email not exist ================');
							res.json({
								error: 'Recovery email not exist'
							})
						}
					}
				})

			}
		})
	}

	function checkExpiredEmail(req, res, next){
		const token = req.body.token;
		console.log('token get email ================', token);
		if(token){
			db.getSortedSetRangeWithScores('token:'+token+':email', 0, -1, function(err, results){
				console.log('================ checkExpiredEmail results: ', results);
				winston.info('Email request change password:', results[0]);
				if(err){
					next(new Error(err));
				}else if(results.length > 0){
					const recoverEmail = results[0].value;
					const expiredDate = moment(new Date(results[0].score));
					const now = moment(new Date());
					const diffHours = Math.abs(expiredDate - now) / 36e5;

					if(diffHours >= 24){
						winston.info('Request change password expired');
						res.json({uid: null, message: "Request change password expired"});
					}else{
						db.getSortedSetByValue('email:uid', results[0].value, function(err, results){
							winston.info('Request change password user:', results[0]);
							res.json({uid: results[0], email: recoverEmail});
						})
					}
				}else{
					winston.info('Request change password expired');
					res.json({uid: null, message: "Request change password expired"});
				}
			})
		}else{
			res.json({uid: null, message: "Token invalid"});
		}
	}

	function recoverPassword(req, res, next){
		const newPassword = req.body.recoverPassword;
		const uid = req.body.recoverUid;
		const email = req.body.recoverEmail;
		// console.log('recoverPassword ==============', newPassword);

		if (!newPassword) {
			winston.info("Missing recover password");
			res.json(new Error('Missing recover password'));
		}
		else{
			user.hashPassword(newPassword, function(err, hash) {
				if (err) {
					winston.info(err);
					res.json({
						message: "Can not hash password",
						error: new Error(err)
					});
				}else{
					db.setObjectField('user:'+uid , 'password', hash, function(err) {
						if(err){
							winston.info(err);
							res.json({
								message: "Can not set new password",
								error: new Error(err)
							});
						}else{
							db.getSortedSetRange('recoveremail:'+email, 0, -1, function(err, arrayTokens){
								if(err){
									winston.info(err);
									res.json({
										message: "Can not get array tokens",
										error: new Error(err)
									});
								}else{
									const _keys = helpers.buildKeys('token', arrayTokens, 'email');

									async.parallel([
										function(next_parallel){
											db.deleteAll(_keys, next_parallel);
										},

										function(next_parallel){
											db.delete('recoveremail:'+email, next_parallel);
										}

									], function(err){
										if(err){
											winston.info(err);
											res.json({
												message: "Can not remove temps recover email",
												error: new Error(err)
											});

										}else{
											res.status(200).send('');
										}
									})
								}
							})
						}
					});
				}
			});
		}
	}

}(exports));
