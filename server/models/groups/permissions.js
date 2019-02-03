'use strict';

var async = require('async'),
	winston = require('winston'),
	_ = require('underscore'),
	helpers = require('./../helpers'),
	permissions = require('./../permissions'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Groups) {

	

	Groups.setPermissions = function (groupName, permissionIds, callback) {
		if (!Array.isArray(permissionIds)){
			callback();
		}

		var key = helpers.buildKey('group', groupName, 'permissions');
		var scores = [];
		for (var i = 0; i< permissionIds.length; i++){
			scores[i] = Date.now() + 1;
		}

		db.sortedSetAdd(key, scores, permissionIds, callback);
	}// End Groups.setPermissions

	//Get detail permission include screen and component privileges
	Groups.getPermissions = function (groupNames, callback) {
		if (!Array.isArray(groupNames)){
			callback();
		}

		var keys = helpers.buildKeys('group', groupNames, 'permissions');
		db.getSortedSetsMembers(keys, function (err, ids) {
			if (err){
				winston.error('Error in Groups.getPermissions >> ', err);
			}
			var permissionIds = _.uniq(_.flatten(ids));
			permissions.getPermissionDetails(permissionIds, callback);
		});
	}// End Groups.getPermissions

};
