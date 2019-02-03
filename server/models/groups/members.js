'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Groups) {

	Groups.addMember = function (groupName, userId, callback) {
		if (!userId || !groupName){
			return callback('Group.addMember >> userId & groupName are required');
		}
		else{
			async.parallel([
				function(next) {
					db.sortedSetAdd('group:'+groupName+':members', Date.now(), userId, next);
				},
				function(next) {
					db.sortedSetAdd('user:'+userId+':groups', Date.now(), groupName, next);
				}
			], function(err) {
				if(err){
					callback(err);
				}
				else
				{
					callback(null,' add success');
				}	
			});
		}
	};//End Group.addMember

	Groups.addMembers = function (groupName, userIds, callback) {
		if (!Array.isArray(userIds)){
			return callback('Group.addMembers >> userIds have to an array');
		}
		var scores = [];
		for (var i = 0; i< userIds.length; i++){
			scores[i] = Date.now() + 1;
		}

		db.sortedSetAdd('group:'+groupName+':members', scores, userIds, callback);

	};//End Group.addMember

	


	Groups.removeMember = function (groupName, userId, callback) {
		if (!userId || !groupName){
			return callback('Group.removeMember >> userId & groupName are required');
		}
		else
		{
			async.parallel([ 
				function(next) {
					db.sortedSetRemove('group:'+groupName+':members', userId, next);
				},
				function(next) {
					db.sortedSetRemove('user:'+userId+':groups', groupName, next);
				}
			], function(err) {
				if(err){
					callback(err);
				}
				else
				{
					callback(null,'remove success');
				}	
			});
		}
	};//End Groups.removeMember

	Groups.removeMembers = function (groupName, userIds, callback) {
		if (!userId || !groupName){
			return callback('Group.removeMember >> userId & groupName are required');
		}
		
		db.sortedSetRemove('group:'+groupName+':members', userIds, callback);

	};//End Groups.removeMembers


	function memberJoinGroups(groupNames, userId, callback) {
		if (!Array.isArray(userIds)){
			return callback('User.groups >> groupNames have to an array');
		}
		var scores = [];
		for (var i = 0; i< groupNames.length; i++){
			scores[i] = Date.now() + 1;
		}

		db.sortedSetAdd('user:'+userId+':groups', scores, groupNames, callback);

	};//End User.groups

	function memberLeaveGroups (groupNames, userId, callback) {
		if (!Array.isArray(userIds)){
			return callback('User.removeGroups >> groupNames have to an array');
		}

		db.sortedSetRemove('user:'+userId+':groups', groupNames, callback);

	};//End User.removeGroups


};
