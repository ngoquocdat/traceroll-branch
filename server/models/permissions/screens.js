'use strict';

var async = require('async'),
	winston = require('winston'),
	helpers = require('./../helpers'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Permissions) {

	Permissions.addScreens = function (permissionId, screenIds, callback) {
		if (!permissionId){
			return callback('Permissions.addScreens >> permissionId is required');
		}
		var scores = [];
		for (var i = 0; i< screenIds.length; i++){
			scores[i] = Date.now() + 1;
		}

		db.sortedSetAdd('permission:' + permissionId + ':screens', scores, screenIds, callback);
		
	}

	//Get screens array include the privilege
	Permissions.getScreens = function (permissionIds, callback) {
		if (!Array.isArray(permissionIds)){
			var key = 'permission:' + permissionIds + ':screens';
			db.getSortedSetRevRange(key, 0, -1, function (err, screenIds) {
				db.getObjectField('permission:'+permissionIds, 'privilege', function (err, privilege) {
					async.map(screenIds, function (elem, next) {
						var newElem = {};
						newElem[elem] = privilege;
						next(null, newElem);
					}, function (err, newScreenIds) {
						if (err){
							winston.error('Permissions.getScreens failed: ', err);
							return callback(err);
						}
						callback(null, newScreenIds);
					});
				});
			});
		} //End process single permission
		else{
			getScreens(permissionIds, callback);
		}
	};// End Permissions.getScreens


	function getScreens(permissionIds, callback){
		var screenKeys = helpers.buildKeys('permission', permissionIds, 'screens');
		var pemissionKeys = helpers.buildKeys('permission',permissionIds);
		async.parallel({
			screensList : function (next) {
				db.getSortedSetsMembers(screenKeys, next);
			},
			permissionsList : function (next) {
				db.getObjectsFields(pemissionKeys,['privilege'],next);
			}
		}, function (err, results) {
			if (err){
				winston.error('Error in get multiple screens >> ', err);
				return (err);
			}
			//console.log(results);
			var returnData = [];
			results.permissionsList.forEach(function (permission, index) {
				if (!permission || !permission['privilege']){
					return;
				}
				results.screensList[index].forEach(function (screen) {
					var newElem = {};
					newElem[screen] = permission['privilege'];
					returnData.push(newElem);
				});

				
			});
			callback(null, returnData);
		});
	}


	

};
