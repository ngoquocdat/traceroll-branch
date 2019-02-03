'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Permissions) {

	Permissions.create = function (data, callback) {
		
		var permissionData = {
				'description' : data.description || '',
				'privilege' : data.privilege || 'hide',
				'score' : Date.now()
		};
		
		db.incrObjectField('global', 'nextPermissionId', function (err, permissionId) {
			var _key = 'permission:' + permissionId;
			db.setObject(_key, permissionData, callback);
		});
		
	}

};
