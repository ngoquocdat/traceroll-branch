'use strict';

var csrf = require('csurf'),
	nconf = require('nconf'),
	async = require('async'),
	winston = require('winston'),
	validator = require('validator'),
	path = require('path'),
	controllers = require('./../controllers'),
	users = require('./../models/users'),
	db = require('./../database/mongo'),
	app,
	middleware = {
		admin: {}
	};

middleware.applyCSRF = csrf();

middleware.prepareAPI = function(req, res, next) {
	res.locals.isAPI = true;
	next();
};

middleware.authorized = function (req, res, next) {
	winston.dct_logger.info('middleware.authorized: ', req.user);
	const uid = req.uid;

	if(req.user) {
    	winston.info('authorized with user: ', req.user);

    	/*CHECK USER IS DELETED*/
        db.getObjectFields('user:'+uid, ["userslug"], function(err, userslug){
			const userSlug = userslug.userslug;

			if(err){
				winston.info('Error get authorized user');
				res.status(500).json({ status: 'Error get authorized user'});
			}else{
				db.sortedSetRank('userslug:uid', userSlug, function(err, results){

					if(err){
						winston.info('Error get authorized user');
						res.status(500).json({ status: 'Error get authorized user'});
					}else if(results === null){
						winston.info('Authorized user not exist');
						res.status(401).json({ status: 'Unauthorized' });
					}else{
						winston.info('User authorized');
						next();
					}
				})
			}
		})
	/*CHECK TOKEN TO DELETE VIA EMAIL*/
    }else if(req.params.token){
    	winston.info('authorized with token: ', req.params.token);
        next();
    }else{
    	res.status(401).json({ status: 'Unauthorized' });
    }
}



middleware.buildHeader = function(req, res, next) {
	res.locals.renderHeader = true;
	async.waterfall([
		function (next) {
			if (req.uid){
				users.isGuest(req.uid, function (err, isGuest) {
						if (isGuest){
							req.uid = null;
							next();
						}else{
							next();
						}
					});
			}else{
				next();
			}
		},
		function (next) {
			middleware.applyCSRF(req, res, function() {
			async.parallel({
				config: function(next) {
					controllers.api.getConfig(req, res, next);
				},
				isAdmin: function(next) {
					if (req.uid) {
						users.isAdministrator(req.uid, next);
					} else {
						next(null);
					}
				},
				user: function(next) {
					if (req.uid) {
						users.getUserFields(req.uid, ['username', 'email', 'picture', 'firstname','lastname'], next);
					} else {
						next(null, {
							username: '[[global:guest]]',
							picture: users.createGravatarURLFromEmail(''),
							status: 'offline',
							banned: false,
							uid: 0
						});
					}
				}
			}, function(err, results) {
				if (err) {
					winston.dct_logger.error(err);
					return next(err);
				}
				results.user.isAdmin = results.isAdmin || false;
				results.user.userId = parseInt(results.user.userId, 10);
				res.locals.isAdmin = results.user.isAdmin;
				res.locals.isAgent =  results.isAgent;
				
				res.locals.config = results.config;
				res.locals.configJSON = JSON.stringify(results.config);
				res.locals.userObj = results.user;
				res.locals.loggedIn = true;
				next();
			});
		});
			
		}
		], next);

};


middleware.addExpiresHeaders = function(req, res, next) {
	if (app.enabled('cache')) {
		res.setHeader("Cache-Control", "public, max-age=5184000");
		res.setHeader("Expires", new Date(Date.now() + 5184000000).toUTCString());
	} else {
		res.setHeader("Cache-Control", "public, max-age=0");
		res.setHeader("Expires", new Date().toUTCString());
	}

	next();
};

middleware.pageView = function(req, res, next) {
	if (req.user) {
		users.isGuest(parseInt(req.user.uid, 10), function(err, isGuest) {
			if (!isGuest) {
				users.updateLastOnlineTime(req.user.uid);
				if (req.path.startsWith('/api/users') || req.path.startsWith('/users')) {
					users.updateOnlineUsers(req.user.uid, next);
				} else {
					users.updateOnlineUsers(req.user.uid);
					next();
				}
			} else {
				next();
			}
		});
	} else {
		next();
	}
};

middleware.redirectToLoginIfNotAdmin = function (req, res, next) {

	if (!req.user || parseInt(req.user.uid, 10) !== 0) {
		users.isAdministrator(req.user.uid, function (err, isAdmin) {
			if (!isAdmin){
				res.send('access_denied');
			}else{
				next();
			}
			
		});
	}else{
		next();
	}
};

middleware.prepareAPI = function(req, res, next) {
	res.locals.isAPI = true;
	next();
};
module.exports = function(webserver) {
	app = webserver;
	return middleware;
};