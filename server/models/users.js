'use strict';

var async = require('async'),
	nconf = require('nconf'),
	util = require('util'),
	utils = require('../../public/js/utils'),
	gravatar = require('gravatar'),
	helpers = require('./helpers'),
	groups = require('./groups.js'),
	_ = require('underscore'),
	Password = require('./../controllers/password.js'),
	winston = require('winston'),
	db = require('../database/mongo');

var USER_KEY = 'user:';
/**
 * Provides User Funtions
 * @class Users
 */
(function(Users){
	require('./users/auth')(Users);
	require('./users/create')(Users);
	require('./users/settings')(Users);
	require('./users/admin')(Users);
	require('./users/delete')(Users);
	require('./users/follow')(Users);
	require('./users/notification')(Users);
	require('./users/socketio')(Users);

	/**
	 * Get User By Id
	 *
	 * @method getUserById
	 * @param  {Int}   userId   User Id
	 * @param  {Function} callback callback function
	 */
	Users.getUserById = function (userId, callback) {
		var key = util.format('user:%s', userId);
		db.getObject(key, function (err, user) {
			if (err){
				return callback(err);
			}

			callback(null, user);
		});
	}

	/**
	 * Get list users by array of user id
	 * @method getUsers
	 * @param  {Array[int]}   userIds  Array of user id Ex: [1,2,3]
	 * @param  {Function} callback Callback function
	 */
	Users.getSimpleUsers = function (userIds, callback) {
		if (!Array.isArray(userIds) || !userIds.length){
			return callback(null, []);
		}

		var keys = userIds.map(function(uid){
			return util.format('user:%s', uid);
		});

		db.getObjects(keys, function (err, users) {
			if (err){
				return callback(err);
			}

			callback(null, users);
		});

	}

	/**
	 * Retrieve the field value of an user by user id
	 * @method getUserField
	 * @param  {Number}     uid      User Id
	 * @param  {String}     field    Field name
	 * @param  {Function}   callback Callback function
	 */
	Users.getUserField = function(uid, field, callback) {
		Users.getUserFields(uid, [field], function(err, user) {
			callback(err, user ? user[field] : null);
		});
	};

	/**
	 * Retrieve array of fields's value by user id
	 * @method getUserFields
	 * @param  {Number}      uid      User Id
	 * @param  {Array}      fields   Array of field's name
	 * @param  {Function}    callback Callback function
	 */
	Users.getUserFields = function(uid, fields, callback) {
		Users.getMultipleUserFields([uid], fields, function(err, users) {
			callback(err, users ? users[0] : null);
		});
	};

	/**
	 * Retrieve list of user fields inclue _key and userId
	 * @method getMultipleUserFields
	 * @param  {Array}              uids     Array of user id
	 * @param  {Array}              fields   Array of fields display
	 * @param  {Function}            callback Callback function
	 */
	Users.getMultipleUserFields = function(uids, fields, callback) {
		var fieldsToRemove = [];
		function addField(field) {
			if (fields.indexOf(field) === -1) {
				fields.push(field);
				fieldsToRemove.push(field);
			}
		}

		if (!Array.isArray(uids) || !uids.length) {
			return callback(null, []);
		}


		var keys = helpers.buildKeys('user', uids);

		if (fields.indexOf('userId') === -1) {
			fields.push('userId');
		}

		if (fields.indexOf('picture') !== -1) {
			addField('email');
		}

		db.getObjectsFields(keys, fields, function(err, users) {
			if (err) {
				return callback(err);
			}
			modifyUserData(users, fieldsToRemove, callback);
		});
	};

	/**
	 * Retrieve user by user id
	 * @method getUserData
	 * @param  {number}    uid      User Id
	 * @param  {Function}  callback callback function
	 */
	Users.getUserData = function(uid, callback) {
		Users.getUsersData([uid], function(err, users) {
			callback(err, users ? users[0] : null);
		});
	};

	/**
	 * Retrieve list of users by array of user id
	 * @method getUsersData
	 * @param  {Array}     uids     array of user id
	 * @param  {Function}   callback Callback function
	 */
	Users.getUsersData = function(uids, callback) {
		if (!Array.isArray(uids) || !uids.length) {
			return callback(null, []);
		}

		var keys = uids.map(function(uid) {
			return USER_KEY + uid;
		});

		db.getObjects(keys, function(err, users) {
			if (err) {
				return callback(err);
			}

			modifyUserData(users, [], callback);
		});
	};


	/**
	 * Reduce each user
	 * @method modifyUserData
	 * @param  {Array[User]}       users          Array of users object
	 * @param  {Array}       fieldsToRemove Array of fields need removed from array of users
	 * @param  {Function}     callback       Callback function
	 */
	function modifyUserData(users, fieldsToRemove, callback) {
		users.forEach(function(user) {
			if (!user) {
				return;
			}

			if (user.password) {
				user.password = undefined;
			}

			if (!parseInt(user.userId, 10)) {
				user.userId = 0;
				user.username = '[[global:guest]]';
				user.userslug = '';
				user.picture = Users.createGravatarURLFromEmail('');
			}

			for(var i=0; i<fieldsToRemove.length; ++i) {
				user[fieldsToRemove[i]] = undefined;
			}
		});

		callback(null, users);
	}

	/**
	 * update last online time by user id
	 * @method updateLastOnlineTime
	 * @param  {number}             uid      User id
	 * @param  {Function}           callback Callback function
	 */
	Users.updateLastOnlineTime = function(uid, callback) {
		callback = callback || function() {};
		Users.getUserFields(uid, ['status', 'lastOnline'], function(err, userData) {
			var now = Date.now();
			if (err || userData.status === 'offline' || now - parseInt(userData.lastOnline, 10) < 300000) {
				return callback(err);
			}

			Users.setUserField(uid, 'lastOnline', now, callback);
		});
	};

	/**
	 * Update online time of user. The time will be upated once latest online less than 5 minutes from current time.
	 * Corresponding to _key:**'users:online'**
	 * @method updateOnlineUsers
	 * @param  {Number}          uid      User id
	 * @param  {Function}        callback Callback function
	 */
	Users.updateOnlineUsers = function(uid, callback) {
		callback = callback || function() {};
		var now = Date.now();
		async.waterfall([
			function(next) {
				db.sortedSetScore('users:online', uid, next);
			},
			function(userOnlineTime, next) {
				if (now - parseInt(userOnlineTime, 10) < 300000) {
					return callback();
				}
				db.sortedSetAdd('users:online', now, uid, next);
			}
		], callback);
	};

	/**
	 * Add new or update field into a User
	 * @method setUserField
	 * @param  {Number}     uid      User id
	 * @param  {String}     field    Field name
	 * @param  {Value}     value    Field value
	 * @param  {Function}   callback Callback function
	 */
	Users.setUserField = function(uid, field, value, callback) {
		callback = callback || function() {};
		db.setObjectField(USER_KEY + uid, field, value, function(err) {
			if (err) {

				return callback(err);
			}
			//plugins.fireHook('action:user.set', {uid: uid, field: field, value: value, type: 'set'});
			callback();
		});
	};

	/**
	 * Add new or update fields into a User
	 * @method setUserFields
	 * @param  {Number}      uid      User id
	 * @param  {Object}      data     Json object
	 * @param  {Function}    callback Callback function
	 */
	Users.setUserFields = function(uid, data, callback) {
		callback = callback || function() {};
		db.setObject(USER_KEY + uid, data, function(err) {
			if (err) {
				return callback(err);
			}
			/*for (var field in data) {
				if (data.hasOwnProperty(field)) {
					plugins.fireHook('action:user.set', {uid: uid, field: field, value: data[field], type: 'set'});
				}
			}*/
			callback();
		});
	};

	/**
	 * Increment user field as number
	 * @method incrementUserFieldBy
	 * @param  {Number}             uid      User id
	 * @param  {String}             field    Field name
	 * @param  {Number}             value    Value as number
	 * @param  {Function}           callback Callback function
	 */
	Users.incrementUserFieldBy = function(uid, field, value, callback) {
		callback = callback || function() {};
		db.incrObjectFieldBy(USER_KEY + uid, field, value, function(err, value) {
			if (err) {
				return callback(err);
			}
			//plugins.fireHook('action:user.set', {uid: uid, field: field, value: value, type: 'increment'});

			callback(null, value);
		});
	};

	/**
	 * Increment user field as number
	 * @method decrementUserFieldBy
	 * @param  {Number}             uid      User id
	 * @param  {String}             field    Field name
	 * @param  {Number}             value    Value as number
	 * @param  {Function}           callback Callback function
	 */
	Users.decrementUserFieldBy = function(uid, field, value, callback) {
		callback = callback || function() {};
		db.incrObjectFieldBy(USER_KEY + uid, field, -value, function(err, value) {
			if (err) {
				return callback(err);
			}
			//plugins.fireHook('action:user.set', {uid: uid, field: field, value: value, type: 'decrement'});

			callback(null, value);
		});
	};

	Users.getUidsFromSet = function(set, start, stop, callback) {
		if (set === 'users:online') {
			var count = parseInt(stop, 10) === -1 ? stop : stop - start + 1;
			var now = Date.now();
			db.getSortedSetRevRangeByScore(set, start, count, now, now - 300000, callback);
		} else {
			db.getSortedSetRevRange(set, start, stop, callback);
		}
	};

	Users.getUsersFromSet = function(set, uid, start, stop, callback) {
		async.waterfall([
			function(next) {
				Users.getUidsFromSet(set, start, stop, next);
			},
			function(uids, next) {
				Users.getUsers(uids, uid, next);
			}
		], callback);
	};

	/**
	 * Get list of users with full information by array of user id
	 * @method getUsers
	 * @param  {Array}   uids     Array of user id
	 * @param  {Function} callback Callback function
	 */
	Users.getUsers = function(uids, callback) {
		var fields = ['userId', 'username', 'userslug', 'fullname', 'status', 'banned', 'joinDate','email','isProfileImageHide'];

		fields = fields.filter(function(field, index, array) {
			return array.indexOf(field) === index;
		});
		async.parallel({
			userData: function(next) {
				Users.getMultipleUserFields(uids, fields, next);
			},
			isAdmin: function(next) {
				Users.isAdministrator(uids, next);
			}/*,
			isOnline: function(next) {
				require('./socket.io').isUsersOnline(uids, next);
			}*/
		}, function(err, results) {
			if (err) {
				return callback(err);
			}

			results.userData.forEach(function(user, index) {
				if (!user) {
					return;
				}
				//user.status = Users.getStatus(user.status, results.isOnline[index]);
				user.joindateISO = utils.toISOString(user.joinDate);
				user.administrator = results.isAdmin[index];
				user.banned = parseInt(user.banned, 10) === 1;
			});

			callback(null, results.userData);
		});
	};

	/**
	 * Get status of user (online | offline)
	 * @method getStatus
	 * @param  {String}  status   Status
	 * @param  {Boolean} isOnline Online or not
	 */
	Users.getStatus = function(status, isOnline) {
		return isOnline ? (status || 'online') : 'offline';
	};


	/**
	 * Creat avatar link by email using Gravatar providers
	 * @method createGravatarURLFromEmail
	 * @param  {String}                   email Email address of user
	 */
	 Users.createGravatarURLFromEmail = function(email) {
		 var randomUserProfile;
		 //function to return int
		 function getRandomInt(max) {
			 return Math.floor(Math.random() * Math.floor(max));
		 }

		 //Updated code to be in line with onboarding process
		 //NEED TO REFACTOR
		 switch(getRandomInt(3)){
			 case 1:
				 randomUserProfile = 'https://s3.amazonaws.com/traceroll-bucket/profile/ProfileAvatar01.png';
				 break;
			 case 2:
				 randomUserProfile = 'https://s3.amazonaws.com/traceroll-bucket/profile/ProfileAvatar01.png';
				 break;
			 case 3:
				 randomUserProfile = 'https://s3.amazonaws.com/traceroll-bucket/profile/ProfileAvatar01.png';
				 break
			 default:
				 randomUserProfile = 'https://s3.amazonaws.com/traceroll-bucket/profile/ProfileAvatar01.png';
				 break;
		 }
		 //create a math.random function to incorporate profile images (3)
		 var options = {
			 size: 128,
			 d: `${randomUserProfile}`,
			 rating: 'pg'
		 };

		if (!email) {
			email = '';
		}

		return gravatar.url(email, options, true);
	};

	Users.hashPassword = function(password, callback) {

		if (!password) {
			console.log('err');
			return callback(null, password);
		}

		Password.hash(nconf.get('bcrypt_rounds') || 12, password, callback);
	};

	Users.addTopicIdToUser = function(uid, tid, timestamp, callback) {
		async.parallel([
			async.apply(db.sortedSetAdd, 'uid:' + uid + ':topics', timestamp, tid),
			async.apply(Users.incrementUserFieldBy, uid, 'topiccount', 1)
		], callback);
	};

	Users.exists = function(userslug, callback) {
		if (userslug === parseInt(userslug, 10)){
			var userId = userslug;
			Users.getUsernamesByUids([userId], function (err, exists) {
				callback(err, !!exists);
			});
		} else{
			Users.getUidByUserslug(userslug, function(err, exists) {
				callback(err, !! exists);
			});
		}

	};


	/**
	 * Get user id by user name. The following data: {_key:**'username:uid'**, score:**'userid'**, value: **'username'**}
	 * @method getUidByUsername
	 * @param  {String}         username User name
	 * @param  {Function}       callback Callback function
	 */
	Users.getUidByUsername = function(username, callback) {
		if (!username) {
			return callback();
		}
		db.sortedSetScore('username:uid', username, callback);
	};

	Users.getUidsByUsernames = function(usernames, callback) {
		db.sortedSetScores('username:uid', usernames, callback);
	};

	Users.getUidByUserslug = function(userslug, callback) {
		if (!userslug) {
			return callback();
		}
		db.sortedSetScore('userslug:uid', userslug, callback);
	};

	Users.getUidByFBID = (fbID,callback) => {
		if (!fbID) {
			return callback();
		}
		db.sortedSetScore('fbid:uid', fbID, callback);
	}

	Users.getUsernamesByUids = function(uids, callback) {
		Users.getMultipleUserFields(uids, ['username'], function(err, users) {
			if (err) {
				return callback(err);
			}

			users = users.map(function(user) {
				return user.username;
			});

			callback(null, users);
		});
	};

	Users.getUsernameByUserslug = function(slug, callback) {
		async.waterfall([
			function(next) {
				Users.getUidByUserslug(slug, next);
			},
			function(uid, next) {
				Users.getUserField(uid, 'username', next);
			}
		], callback);
	};

	Users.getUidByEmail = function(email, callback) {
		db.sortedSetScore('email:uid', email.toLowerCase(), callback);
	};

	Users.getUsernameByEmail = function(email, callback) {
		db.sortedSetScore('email:uid', email.toLowerCase(), function(err, uid) {
			if (err) {
				return callback(err);
			}
			Users.getUserField(uid, 'username', callback);
		});
	};

	Users.isModerator = function(uid, cid, callback) {
		function filterIsModerator(err, isModerator) {
			if (err) {
				return callback(err);
			}

			plugins.fireHook('filter:user.isModerator', {uid: uid, cid:cid, isModerator: isModerator}, function(err, data) {
				if (Array.isArray(uid) && !Array.isArray(data.isModerator) || Array.isArray(cid) && !Array.isArray(data.isModerator)) {
					return callback(new Error('filter:user.isModerator - i/o mismatch'));
				}

				callback(err, data.isModerator);
			});
		}

		if (Array.isArray(cid)) {
			if (!parseInt(uid, 10)) {
				return filterIsModerator(null, cid.map(function() {return false;}));
			}
			var uniqueCids = cid.filter(function(cid, index, array) {
				return array.indexOf(cid) === index;
			});

			var groupNames = uniqueCids.map(function(cid) {
					return 'cid:' + cid + ':privileges:mods';	// At some point we should *probably* change this to "moderate" as well
				}),
				groupListNames = uniqueCids.map(function(cid) {
					return 'cid:' + cid + ':privileges:groups:moderate';
				});

			async.parallel({
				user: async.apply(groups.isMemberOfGroups, uid, groupNames),
				group: async.apply(groups.isMemberOfGroupsList, uid, groupListNames)
			}, function(err, checks) {
				if (err) {
					return callback(err);
				}

				var isMembers = checks.user.map(function(isMember, idx) {
						return isMember || checks.group[idx];
					}),
					map = {};

				uniqueCids.forEach(function(cid, index) {
					map[cid] = isMembers[index];
				});

				filterIsModerator(null, cid.map(function(cid) {
					return map[cid];
				}));
			});
		} else {
			if (Array.isArray(uid)) {
				async.parallel([
					async.apply(groups.isMembers, uid, 'cid:' + cid + ':privileges:mods'),
					async.apply(groups.isMembers, uid, 'cid:' + cid + ':privileges:groups:moderate')
				], function(err, checks) {
					var isModerator = checks[0].map(function(isMember, idx) {
							return isMember || checks[1][idx];
						});
					filterIsModerator(null, isModerator);
				});
			} else {
				async.parallel([
					async.apply(groups.isMember, uid, 'cid:' + cid + ':privileges:mods'),
					async.apply(groups.isMember, uid, 'cid:' + cid + ':privileges:groups:moderate')
				], function(err, checks) {
					var isModerator = checks[0] || checks[1];
					filterIsModerator(null, isModerator);
				});
			}
		}
	};

	/**
	 * Check use is a administrator of not.
	 * @method isAdministrator
	 * @param  {Number/Array}        uid      User id(s)
	 * @param  {Function}      callback Callback function
	 */
	Users.isAdministrator = function(uid, callback) {
		if (Array.isArray(uid)) {
			groups.isMembers(uid, 'administrators', callback);
		} else {
			groups.isMember(uid, 'administrators', callback);
		}
	};

	Users.isAgent = function (uid, callback) {
		if (Array.isArray(uid)) {
			groups.isMembers(uid, 'Agent', callback);
		} else {
			groups.isMember(uid, 'Agent', callback);
		}
	}

	Users.getIgnoredCategories = function(uid, callback) {
		db.getSortedSetRange('uid:' + uid + ':ignored:cids', 0, -1, callback);
	};

	Users.getWatchedCategories = function(uid, callback) {
		async.parallel({
			ignored: function(next) {
				Users.getIgnoredCategories(uid, next);
			},
			all: function(next) {
				db.getSortedSetRange('categories:cid', 0, -1, next);
			}
		}, function(err, results) {
			if (err) {
				return callback(err);
			}

			var watched = results.all.filter(function(cid) {
				return cid && results.ignored.indexOf(cid) === -1;
			});
			callback(null, watched);
		});
	};

	Users.ignoreCategory = function(uid, cid, callback) {
		if (!uid) {
			return callback();
		}
		db.sortedSetAdd('uid:' + uid + ':ignored:cids', Date.now(), cid, callback);
	};

	Users.watchCategory = function(uid, cid, callback) {
		if (!uid) {
			return callback();
		}
		db.sortedSetRemove('uid:' + uid + ':ignored:cids', cid, callback);
	};

	Users.getAgent = function (agentId, callback) {
		if (!agentId.length){
			return callback(null, []);
		}

		//var key = util.format('agent:%s', agentId);
		var key = util.format('user:%s', agentId);
		db.getObject(key, function (err, agent) {
			if (err){
				return callback(err);
			}
			callback(null, agent);
		});
	}

	Users.getAgents = function (agentIds, callback) {
		if (!Array.isArray(agentIds) || !agentIds.length){
			return callback(null, []);
		}

		//var key = util.format('agent:%s', agentId);
		var keys = helpers.buildKeys('agent', agentIds);
		db.getObjects(keys, function (err, agents) {
			if (err){
				return callback(err);
			}
			callback(null, agents);
		});
	}

	Users.isOnline = function(uid, callback) {
		db.sortedSetScore('users:online', uid, function(err, lastonline) {
			if (err) {
				return callback(err);
			}
			var isOnline = Date.now() - parseInt(lastonline, 10) < 300000;
			callback(null, isOnline);
		});
	};

	/*
	Update user actual user status based on status field and lastonline time
	 */
	Users.updateStatus = function (users, callback) {
		if (!Array.isArray(users) || !users.length){
			callback(null, users);
		}
		async.each(users ,function (user, next) {
            if(user && parseInt(user.userId, 10)){
                Users.isOnline(user.userId, function (err, isOnline) {
                    if (!err){
                        user.status = Users.getStatus(user.status, isOnline);
                        next();
                    }
                });
            }
        }, function (err) {
            if (!err){
                callback(null,users);
            }else{
                winston.error(err);
                callback(err,users);
            }
        });
	}

	Users.isOnlineArray = function (uids, callback) {

	}

	Users.changePassWord = function (uid,data,callback){

		async.waterfall([
			function (next) {
				db.getObject(USER_KEY+uid,next);

			}, function (result, next) {
				winston.info('Compare password...');
				if (!result.password || result.password.length < 1/*meta.config.minimumPasswordLength*/) {
					return next(new Error('[[user:change_password_error_length]]'));
				}
				Password.compare(data.oldpassword, result.password, next);

			},function (passwordMatch,next){
				if (!passwordMatch) {
					return next(new Error('[[error:old-password-not-match]]'));
				}
				else
				{
					winston.info('change password...');
					next();
				}


			}], function(err){

				if (err){
					console.error("Error: " + err);
					callback(err,[]);
				}
				else
				{
					Users.hashPassword(data.rpassword, function (err, password)
					{
						db.setObjectField(USER_KEY+uid,'password',password,function (err,result)
						{

						});
					})

					callback(null,[]);
				}

		});
	};

	Users.getRecentChatUsers = function (uid, start, stop, callback) {
		//winston.info('getRecentChatUsers is called');
		if (start > stop || start < 0 || stop < 0){
			callback(null, []);
		}
		var key = helpers.buildKey('uid', uid, 'chats');
		db.getSortedSetRevRange(key, start, stop, function (err, uids) {
			if (err){
				callback(err);
			}

			async.parallel({
				unread: function(next) {
					db.isSortedSetMembers('uid:' + uid + ':chats:unread', uids, next);
				},
				users: function(next) {
					Users.getMultipleUserFields(uids, ['userId', 'picture', 'fullName', 'username', 'status', 'email'] , next);
				}
			}, function(err, results) {
				if (err) {
					return callback(err);
				}
			var index = 0;
			async.each(results.users, function (userData, next) {
				if (userData) {
						userData.unread = results.unread[index++];
						Users.isOnline(userData.userId, function (err, isOnline) {
							userData.status = Users.getStatus(userData.status, isOnline);
							next();
						});
					}

			}, function (err) {
				if (!err){
					callback(null, results.users);
				} else {
					winston.error(err);
				}
			});
		});

		});
	};

	Users.isGuest = function (uid, callback) {
		if (!uid){
			callback(null, false);
		}

		db.getObjectField('user:'+uid, 'guestUser', function (err, isGuest) {
			if (err){
				callback(err, false);
			}
			if (parseInt(isGuest) == 1){
				callback(null, true);
				//console.log('user ' + uid + ' is guest user');
			}else{
				callback(null, false);
				//console.log('user ' + uid + ' is system user');
			}
		});
	}




	// Users.getListUsers = function(callback)
	// {

	// 	var listUserId = [];
 //        var keyUser = "users:joindate";
 //        var start = 0;

 //        db.getObjectValue(keyUser, function(err, data){
 //            if (err){

 //                    return callback(err,[]);
 //            }

 //            //get user
 //           	Users.getUsers(data,function(err,listUsers){
 //           		if(err){
 //           			callback(err,[])
 //           		}else{
 //           			callback(null,listUsers)
 //           		}
 //           	})
 //        })
	// }
	Users.getListUsers = function(callback)
	{

	  	var listUserId = [];
        var keyUser = "users:joindate";
        var start = 0;

        db.getObjectValue(keyUser, function(err, data){
            if (err){
                return callback(err,[]);
            }
           	else
		    {
			    //sort user
			    var listGroupByUser = [];
			    db.getSortedSetRevRangeWithScores(keyUser,start,data.length,function (err,resultData) {
			     	async.each(resultData, function (item, callback) {
				      	listUserId.push(item.value);
				      	callback();
				     },
			     	function (err) {
				      	if (err) {
				       		console.log("Error happened");
				      	}
				     	else {
				     		async.parallel({
	                            //Get array agent  by agent id
	                            listUsers: function (next) {
	                                Users.getUsers(listUserId, next);

	                            },
	                            //Get information user of agent  by agent id
	                            listGroups:function (next) {
	                                groups.getListMultiSelectGroups (next);

	                            },
	                            listGroupsByUser: function (next){
	                                Users.listGroupsByUser(listUserId,next);
	                            },
                        	},

                       	    function (err, results) {

                            	if (err){
                                	return callback(err);
                            	}

                      			var users = results.listUsers;

                            	for (var i=0; i<users.length; i++){

                            		users[i].listGroups = results.listGroups;
                            		users[i].listGroupByUser = results.listGroupsByUser[users[i].userId+'_group'];
                            	}

                            	callback(null,users);
                     		});

				      	}
			     	}
			    )});
			}
	    });
	}

	Users.listGroupsByUser = function (userIds, callback) {
		var listGroupByUser = [];
        async.each(userIds, function (userId, callback) {
        	Users.getGroupsByUserId(userId,function(err,groupName){
        		if(err){
        			console.log(err);
        		}
        		else{

        			var arrayGroup = [];
        			async.each(groupName, function (groupItem, callback) {
        				if(groupItem == undefined){
	        				var group = {
							'Text': 1,
	        				'Value': 1,
	        				'Selected':'1'

							};
							arrayGroup.push(group);
							callback();
						}
						else{
							var group = {
								'Text': groupItem,
		        				'Value': groupItem,
		        				'Selected':'1'

							};

							arrayGroup.push(group);
							callback();
						}


        			}, function(err){

        				listGroupByUser[userId+'_group'] = arrayGroup;
        				callback();
       				});

        		}

        	})


        },
        function(err){

        	callback(null,listGroupByUser);
        });
	}


	//Get group name list base on list user id
	Users.getGroupsByUserId = function (userId, callback) {
		if (!userId){
			callback();
		}
		var key = helpers.buildKey('user', userId, 'groups');
		db.getSortedSetsMembers([key], function (err, data) {
			if (err){
				winston.error("Error in Users.getGroups >> ", err);
				callback(err);
			}
			var groupNames = _.uniq(_.flatten(data));
			callback(null, groupNames);


		});
	}// End Users.getGroups

	//Get permission
	Users.getPermissionsByUserId = function (userId, callback) {
		if (!userId){
			callback('userId is required.');
		}

		Users.getGroupsByUserId(userId, function (err, groupNames) {
			if (err){
				winston.error('Error in User.getPermissions >> ', err);
				callback(err);
			}
			groups.getPermissions(groupNames, callback);
		})
	}

	Users.searchUserByName = function(inputSearch, callback){
		console.log('==== searchUserByName ===== models');

		db.getListUserByInputSearch(inputSearch, function(err, listUserId){
			if(err){
				callback(err, listUserId);
			}else if(listUserId.length === 0 ){
				callback(null, []);
			}else{
				var _keys = helpers.buildKeys("user", listUserId);
				db.getObjects(_keys, function(err, listUsers){
					if(err){
						callback(new Error(err));
					}else{
						callback(null, listUsers);
					}
				})
			}
		})
	}

	Users.updateProfilePosition = (userId, pos, callback) => {

		db.setObjectField(USER_KEY + userId, 'profilePosition', pos, (err,result) => {
			callback(err, result)
		})
	}

	Users.updateProfileImageHide = (userId, isHide, callback)=>{
		db.setObjectField(USER_KEY + userId, 'isProfileImageHide', isHide, (err,result) => {
			callback(err, result)
		});
	}

})(exports);
