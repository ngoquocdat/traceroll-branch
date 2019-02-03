'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Frames){
	Frames.delete = function (uid, callback) {
		if (!uid){
			var errMessage = 'User is required';
			winston.info(errMessage);
			return callback(new Error(errMessage));
		}
		var frame = {};
		const _key = 'frame:' + uid;
		async.waterfall([
					function(next) {
						db.getObject(_key, next);
					},
					function(frameObj, next) {
						if (!frameObj)	{
							return next(new Error("Frame is not exist"));
						}
						frame = frameObj;				
						db.delete(_key, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetRemove('frames:created-date', frame.id, next);
							},
							function(next) {
								db.sortedSetRemove('user:'+frame.ownerid+':frames', frame.id, next);
							},
							function(next) {
								db.sortedSetAdd('frame:deleted_by', uid, frame.id, next);
							}
						], next);
					}
				], callback);
	}
};