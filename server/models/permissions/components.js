'use strict';

var async = require('async'),
	winston = require('winston'),
	helpers = require('./../helpers'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Permissions) {

	Permissions.addComponents = function (permissionId, componentIds, callback) {
		if (!permissionId){
			return callback('Permissions.addComponents >> permissionId is required');
		}
		var scores = [];
		for (var i = 0; i< componentIds.length; i++){
			scores[i] = Date.now() + 1;
		}
		db.sortedSetAdd('permission:' + permissionId + ':components', scores, componentIds, callback);
		
	};// End Permission.addComponents


	//Get components array include the privilege
	Permissions.getComponents = function (permissionIds, callback) {
		if (!Array.isArray(permissionIds)){
			var key = 'permission:' + permissionIds + ':components';
			db.getSortedSetRevRange(key, 0, -1, function (err, screenIds) {
				db.getObjectField('permission:'+permissionIds, 'privilege', function (err, privilege) {
					async.map(screenIds, function (elem, next) {
						var newElem = {};
						newElem[elem] = privilege;
						next(null, newElem);
					}, function (err, newScreenIds) {
						if (err){
							winston.error('Permissions.getcomponents failed: ', err);
							return callback(err);
						}
						callback(null, newScreenIds);
					});
				});
			});
		} //End process single permission
		else{
			getcomponents(permissionIds, callback);
		}
	};// End Permissions.getcomponents


	function getcomponents(permissionIds, callback){
		var componentKeys = helpers.buildKeys('permission', permissionIds, 'components');
		var pemissionKeys = helpers.buildKeys('permission',permissionIds);
		async.parallel({
			componentsList : function (next) {
				db.getSortedSetsMembers(componentKeys, next);
			},
			permissionsList : function (next) {
				db.getObjectsFields(pemissionKeys,['privilege'],next);
			}
		}, function (err, results) {
			if (err){
				winston.error('Error in get multiple components >> ', err);
				return (err);
			}
			//console.log(results);
			var returnData = [];
			results.permissionsList.forEach(function (permission, index) {
				if (!permission || !permission['privilege']){
					return;
				}
				results.componentsList[index].forEach(function (screen) {
					var newElem = {};
					newElem[screen] = permission['privilege'];
					returnData.push(newElem);
				});

				
			});
			callback(null, returnData);
		});
	}

};
