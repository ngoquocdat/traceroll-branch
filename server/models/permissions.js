var async = require('async'),
	nconf = require('nconf'),
	util = require('util'),
	gravatar = require('gravatar'),
	helpers = require('./helpers'),
	Users = require('./users'),
	db = require('../database/mongo');

(function(Permissions) {
	require('./permissions/create')(Permissions);
	require('./permissions/screens')(Permissions);
	require('./permissions/components')(Permissions);

	Permissions.getPrivilageByPermissionId = function(permissionId, callback){
		if (!permissionId){
			return callback('Permission.getPrivilageByPermissionId >> permissionId is required');
		}


		db.getObjectField('permission:' + permissionId, 'privilege', callback);

	}

	Permissions.getPermissionsByGroupName = function (groupName, callback) {
		db.getSortedSetRevRange('group:' + groupName + ':permissions', 0, -1, callback);
	}
	
	Permissions.getPermissionDetails = function (permissionIds, callback) {
		async.parallel({
			screensList : function (next) {
				Permissions.getScreens(permissionIds, next);
			},
			componentsList : function (next) {
				Permissions.getComponents(permissionIds, next);
			}
		}, function (err, results) {
			if (err){
				winston.error('Error in Permissions.getPermissionDetails >> ', err);
				return callback(err);
			}

			var returnData = {};
			returnData['screens'] = results.screensList;
			returnData['components'] = results.componentsList;

			callback(null, returnData);
		});
	}
}(module.exports));