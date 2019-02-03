'use strict';

var async = require('async'),
	validator = require('validator'),
	utils = require('../../../public/js/utils'),
	users = require('../users'),
	db = require('../../database/mongo'),
	fs = require('fs'),
	path = require('path'),
	nconf = require('nconf');

module.exports = function(Users) {

	Users.create = function(data, callback) {
		//console.log(data);
		data.username = data.username.trim();
		data.userslug = utils.slugify(data.username);
		if (data.email !== undefined) {
			data.email = validator.escape(data.email.trim());
		}

		isDataValid(data, function(err) {
			if (err)  {
				console.log(err)
				return callback(err);
			}
			var gravatar = data.picture ? data.picture : Users.createGravatarURLFromEmail(data.email) + '.jpg';
			var timestamp = Date.now();
			
			var userData = {
				'banned': 0,
				'birthday': '',
				'email': data.email,
				'firstname': data.firstname,
				'lastname': data.lastname,
				'fullname': data.fullname,
				'joinDate': timestamp,
				'lastOnline': '',
				'lastResponseTime': '',
				'password': '',
				'passwordExpiry': 0,
				'picture': gravatar,
				'responseCount': 0,
				'signature': '',
				'status': 'online',
				'userId': '',
				'username': data.username,
				'userslug': data.userslug,				
				'profileviews': 0,
				'fbID':data.fbID											
			};

			var userDataSearch = {
				"userid": '',
				"score": Date.now()
			};

			async.parallel({
				renamedUsersname: function(next) {
					//renameUsersname(userData, next);
					next(null,userData);
				}
			}, function(err, results) {
				if (err) {
					return callback(err);
				}


				var userNameChanged = false;

				if (userNameChanged) {
					userData.username = results.renamedUsersname;
					userData.userslug = utils.slugify(results.renamedUsersname);
				}

				async.waterfall([
					function(next) {
						db.incrObjectField('global', 'nextUserId', next);
					},
					function(uid, next) {						
						userData.userId = uid;
						userDataSearch.userid = uid;
						db.setObject('user:' + uid, userData, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetAdd('username:uid', userData.userId, userData.username, next);
							},
							function(next) {
								db.sortedSetAdd('userslug:uid', userData.userId, userData.userslug, next);
							},
							function(next) {
								db.sortedSetAdd('users:joindate', timestamp, userData.userId, next);
							},
							function(next){
								if (userData.fbID) {
									let fbID = userData.fbID
									db.sortedSetAdd('fbid:uid', userData.userId, fbID, next);
								}
								else {
									next()
								}
							},
							function(next){
								db.setObjectSearch(userData.username, userDataSearch, next);
							},
							function(next){
								db.setObjectSearch(userData.fullname, userDataSearch, next);
							},
							function(next) {
								if (userData.email) {
									db.sortedSetAdd('email:uid', userData.userId, userData.email.toLowerCase(), next);
									//if (parseInt(userData.uid, 10) !== 1 && parseInt(meta.config.requireEmailConfirmation, 10) === 1) {
									/*if (parseInt(userData.uid, 10) !== 1) {
										Users.email.sendValidationEmail(userData.uid, userData.email);
									}*/
								} else {
									next();
								}
							},
							function(next) {
								if (!data.password) {
									return next();
								}
								Users.hashPassword(data.password, function(err, hash) {
									if (err) {
										return next(err);
									}
									db.setObjectField('user:' + userData.userId, 'password', hash, function(err) {										
										if (err) {
											return callback(err);
										}
										next();
										//plugins.fireHook('action:user.set', {uid: uid, field: field, value: value, type: 'set'});										
									});									
								});
							}
						], next);
					},
					function(results, next) {
						Users.updateUsersCount(next);
					},
					function(next) {
						if (userNameChanged) {
							//Users.notifications.sendNameChangeNotification(userData.uid, userData.username);
						}
						//plugins.fireHook('action:user.create', userData);
						next(null, userData.userId);
					}
				], callback);
			});
		});
	};
	
	Users.updateProfileImage = function(data, callback) {
		var userData = {
			picture: data.filePath
		};
		async.waterfall([
			function(next) {
				users.getUserData(data.uid, (err, user) => {
					const oldPicture = user.picture,
						arr = oldPicture.split('/'),
						fileName = arr[arr.length - 1],
						upload_path = nconf.get('upload_path'),
						appDir = fs.realpathSync(process.cwd()),
						filePath = path.join(appDir, upload_path, fileName);

					fs.unlink(filePath, function(err) {})
					next();
				});
			},
			function(next) {
				db.setObject('user:' + data.uid, userData, next);
			}
		], callback);
	};

	Users.edit = function(data, callback) {
		data.username = data.username.trim();
		data.userslug = utils.slugify(data.username);
		if (data.email !== undefined) {
			data.email = validator.escape(data.email.trim());
		}

		isDataValidEdit(data, function(err) {
		
			if (err)  {
				return callback(err);
			}
			var gravatar = Users.createGravatarURLFromEmail(data.email);
			var timestamp = Date.now();
			
			var userData = {
				'banned': 0,
				'birthday': '',
				'email': data.email,
				'firstname': data.firstname,
				'lastname': data.lastname,
				'joinDate': timestamp,
				'lastOnline': '',
				'lastResponseTime': '',
				'password': '',
				'passwordExpiry': 0,
				'picture': gravatar,
				'responseCount': 0,
				'signature': '',
				'status': 'online',
				'userId': '',
				'username': data.username,
				'userslug': data.userslug,				
				'profileviews': 0											
			};
			async.parallel({
				renamedUsersname: function(next) {
					//renameUsersname(userData, next);
					next();
				}
			}, function(err, results) {

				if (err) {
					return callback(err);
				}


				var userNameChanged = false;

				if (userNameChanged) {
					userData.username = results.renamedUsersname;
					userData.userslug = utils.slugify(results.renamedUsersname);
				}

				async.waterfall([
					function(next) {
						next();
					},
					function(next) {						
						
						
						db.setObject('user:' +userData.userId, userData, next);
					},
					function(next) {
							
						async.parallel([
							function(next) {
								db.sortedSetAdd('username:uid', userData.userId, userData.username, next);
							},
							function(next) {
								db.sortedSetAdd('userslug:uid', userData.userId, userData.userslug, next);
							},
							function(next) {
								db.sortedSetAdd('users:joindate', timestamp, userData.userId, next);
							},
							function(next) {
								if (userData.email) {
									db.sortedSetAdd('email:uid', userData.userId, userData.email.toLowerCase(), next);
								} else {
									next();
								}
							},
							function(next) {
								if (!data.password) {
									return next();
								}
								else{
									Users.hashPassword(data.password, function(err, hash) {
										if (err) {
											return next(err);
										}
										db.setObjectField('user:' + userData.userId, 'password', hash, function(err) {										
											if (err) {
												return callback(err);
											}
											next();
											//plugins.fireHook('action:user.set', {uid: uid, field: field, value: value, type: 'set'});										
										});									
									});
								}
					
							}
						], next);
					},
					function(results, next) {
						
						//Users.updateUsersCount(next);
						next();
					},
					function(next) {
						if (userNameChanged) {
							//Users.notifications.sendNameChangeNotification(userData.uid, userData.username);
						}
						//plugins.fireHook('action:user.create', userData);
						next(null, userData.userId);
					}
				], callback);
			});
		});
	};
	Users.updateUsersCount = function(callback) {
		db.sortedSetCard('users:joindate', function(err, count) {
			if (err) {
				return callback(err);
			}
			db.setObjectField('global', 'userCount', count, callback);
		});
	};

	Users.createGuest = function (data, callback) {
		
		var timestamp = Date.now();
		var gravatar = Users.createGravatarURLFromEmail('user1@gmail.com');
		var userData = {
				'banned': 0,
				'fullName': '',
				'joinDate': timestamp,
				'picture': gravatar,
				'status': 'offline',
				'userId': '',
				'sessionId': data.sessionId,
				'guestUser' : 1
			};
		async.waterfall([
					function(next) {
						db.incrObjectField('global', 'nextUserId', next);
					},
					function(uid, next) {						
						userData.userId = uid;
						db.setObject('user:' + uid, userData, next);
					},
					function(next) {
						db.sortedSetAdd('guests:joindate', timestamp, userData.userId, next);
					},
					function(next) {
						next(null, userData.userId);
					}
				], function (err, userId) {
					callback(err, userId);
				});

	};

	function isDataValid(userData, callback) {
		async.parallel({
			emailValid: function(next) {
				if (userData.email) {
					next(!utils.isEmailValid(userData.email) ? new Error('Invalid email') : null);
				} else {
					next();
				}
			},
			userNameValid: function(next) {
				next((!utils.isUserNameValid(userData.username) || !userData.userslug) ? new Error('Invalid username') : null);
			},
			userNameDuplicate: function (next) {
                db.getSortedSetRange('userslug:uid', 0, -1, function(err, userSlugArray){
                    console.log('userSlugArray: ', userSlugArray);
                    if(err){
                        next(err);
                    }else if(userSlugArray.indexOf(userData.userslug) >= 0){
                        next(new Error('Username already exist'));
                    }else{
                        db.getObjectValue('username:uid', function (err, usernameArray) {
                            if (err){
                                next(err);
                            }
                            if (usernameArray.indexOf(userData.username) >= 0){
                                next(new Error('Username already exists'));
                            }
                            else{
                                next();
                            }
                        });
                    }
                })
            },
			passwordValid: function(next) {
				if (userData.password) {
					next(!utils.isPasswordValid(userData.password) ? new Error('Invalid password') : null);
				} else {
					next();
				}
			},
			emailAvailable: function(next) {
				// if (userData.email) {
				// 	Users.email.available(userData.email, function(err, available) {
				// 		if (err) {
				// 			return next(err);
				// 		}
				// 		next(!available ? new Error('[error:email-taken]') : null);
				// 	});
				// } else {
					next();
				// }
			}
		}, callback);
	}

	function isDataValidEdit(userData, callback) {
		console.log("valid")
		async.parallel({
			emailAvailable: function(next) {
				// if (userData.email) {
				// 	Users.email.available(userData.email, function(err, available) {
				// 		if (err) {
				// 			return next(err);
				// 		}
				// 		next(!available ? new Error('[error:email-taken]') : null);
				// 	});
				// } else {
					next();
				// }
			}
		}, callback);
	}

	function renameUsersname(userData, callback) {
		meta.userOrGroupExists(userData.userslug, function(err, exists) {
			if (err || !exists) {
				return callback(err);
			}

			var	newUsersname = '';
			async.forever(function(next) {
				newUsersname = userData.username + (Math.floor(Math.random() * 255) + 1);
				Users.exists(newUsersname, function(err, exists) {
					if (err) {
						return callback(err);
					}
					if (!exists) {
						next(newUsersname);
					} else {
						next();
					}
				});
			}, function(username) {
				callback(null, username);
			});
		});
	}

	Users.editInfo = function(data, callback) {
		data.username = data.username.trim();
		data.userslug = utils.slugify(data.username);
		if (data.email !== undefined) {
			data.email = validator.escape(data.email.trim());
		}

		isDataValidEdit(data, function(err) {
		
			if (err)  {
				return callback(err);
			}
			var gravatar = Users.createGravatarURLFromEmail(data.email);
			var timestamp = Date.now();
			
			var userData = {
				'banned': 0,
				'birthday': '',
				'email': data.email,
				'firstname': data.firstname,
				'lastname': data.lastname,
				'joinDate': timestamp,
				'lastOnline': '',
				'lastResponseTime': '',
				'password': '',
				'passwordExpiry': 0,
				'picture': gravatar,
				'responseCount': 0,
				'signature': '',
				'status': 'online',
				'userId': '',
				'username': data.username,
				'userslug': data.userslug,				
				'profileviews': 0											
			};

			async.parallel({
				renamedUsersname: function(next) {
					//renameUsersname(userData, next);
					next();
				}
			}, function(err, results) {

				if (err) {
					return callback(err);
				}

				var userNameChanged = false;

				if (userNameChanged) {
					userData.username = results.renamedUsersname;
					userData.userslug = utils.slugify(results.renamedUsersname);
				}

				async.waterfall([
					function(next) {
						next();
					},
					function(next) {						
						
						
						db.setObject('user:' +userData.userId, userData, next);
					},
					function(next) {
							
						async.parallel([
							function(next) {
								db.sortedSetAdd('username:uid', userData.userId, userData.username, next);
							},
							function(next) {
								db.sortedSetAdd('userslug:uid', userData.userId, userData.userslug, next);
							},
							function(next) {
								db.sortedSetAdd('users:joindate', timestamp, userData.userId, next);
							},
							function(next) {
								if (userData.email) {
									db.sortedSetAdd('email:uid', userData.userId, userData.email.toLowerCase(), next);
								} else {
									next();
								}
							}
						], next);
					},
					function(results, next) {
						next();
					},
					function(next) {
						if (userNameChanged) {
							//Users.notifications.sendNameChangeNotification(userData.uid, userData.username);
						}
						next(null, userData.userId);
					}
				], callback);
			});
		});
	};
};
