var async = require('async'),
	nconf = require('nconf'),
	util = require('util'),
	gravatar = require('gravatar'),
	helpers = require('./helpers'),
	Users = require('./users'),
	db = require('../database/mongo');

(function(Groups) {
	require('./groups/create')(Groups);
	require('./groups/members')(Groups);
	require('./groups/permissions')(Groups);

	Groups.getMembers = function(groupName, start, stop, callback) {
		db.getSortedSetRevRange('group:' + groupName + ':members', start, stop, function (err, userIds) {
			Users.getUsersData(userIds, callback);
		});
	};

	Groups.getMembersOfGroups = function(groupNames, callback) {
		db.getSortedSetsMembers(groupNames.map(function(name) {
			return 'group:' + name + ':members';
		}), callback);
	};
	
	Groups.isMember = function(uid, groupName, callback) {
		if (!uid || parseInt(uid, 10) <= 0) {
			return callback(null, false);
		}
		db.isSortedSetMember('group:' + groupName + ':members', uid, callback);
	};

	Groups.isMembers = function(uids, groupName, callback) {
		db.isSortedSetMembers('group:' + groupName + ':members', uids, callback);
	};

	Groups.isMemberOfGroups = function(uid, groups, callback) {
		if (!uid || parseInt(uid, 10) <= 0) {
			return callback(null, groups.map(function() {return false;}));
		}
		groups = groups.map(function(groupName) {
			return 'group:' + groupName + ':members';
		});

		db.isMemberOfSortedSets(groups, uid, callback);
	};


}(module.exports));