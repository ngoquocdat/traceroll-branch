'use strict';

var async = require('async'),
	db = require('./../../database/mongo'),
	meta = {config:{}};

/**
 * Provides User Funtions
 * @class Users
 */
module.exports = function (Users) {
	Users.auth = {};

	/**
	 * Perform lock account when login failed
	 * @method logAttempt
	 * @param  {[type]}   userId    User Id
	 * @param  {[type]}   ipAddress IP Address
	 * @param  {Function} callback  Function callback
	 */
	Users.auth.logAttempt = function (userId, ipAddress, callback) {
		//Check locked user
	db.exists('lockout:' + userId, function(err, exists) {
			if (err) {
				return callback(err);
			}

			if (exists) {
				return callback(new Error('[[error:account-locked]]'));
			}

			db.increment('loginAttempts:' + userId, function(err, attempts) {
				if (err) {
					return callback(err);
				}

				if ((meta.config.loginAttempts || 5) < attempts) {
					// Lock out the account
					db.set('lockout:' + userId, '', function(err) {
						if (err) {
							return callback(err);
						}
						var duration = 1000 * 60 * (meta.config.lockoutDuration || 60);

						db.delete('loginAttempts:' + userId);
						db.pexpire('lockout:' + userId, duration);
						// events.log({
						// 	type: 'account-locked',
						// 	userId: userId,
						// 	ip: ip
						// });
						callback(new Error('[[error:account-locked]]'));
					});
				} else {
					db.pexpire('loginAttempts:' + userId, 1000 * 60 * 60);
					callback();
				}
			});
		});
	};

	Users.auth.clearLoginAttempts = function(userId) {
		db.delete('loginAttempts:' + userId);
	};

	Users.auth.resetLockout = function(userId, callback) {
		async.parallel([
			async.apply(db.delete, 'loginAttempts:' + userId),
			async.apply(db.delete, 'lockout:' + userId)
		], callback);
	};
}