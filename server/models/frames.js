'use strict';

var async = require('async'),
	nconf = require('nconf'),
	helpers = require('./helpers'),
	db = require('../database/mongo');

(function(Frames){
	require('./frames/create')(Frames);
	require('./frames/delete')(Frames);

	var fields = ['_key','ownerid','data','created_by','modified_by','date_modified','date_created'];
	
	Frames.getFrameByUser = function (FrameId, callback) {

		db.getObjectFields('frame:'+FrameId, fields, callback);
		
	}

	Frames.getFrames = function (FrameIds, callback) {

		var keys = helpers.buildKeys('frame', FrameIds);

		db.getObjectsFields(keys, fields, callback);
	}

	Frames.getFrameByUser = function (userId, offset, pageSize, callback) {
		if (!userId){
			return callback(new Error('User ID is required'));
		}

		db.getSortedSetRangeByScore('user:'+userId+':frames', 
										offset*pageSize, 
										pageSize, 
										0, '+inf',
										function (err, FrameIds) {
											
			Frames.getFrames(FrameIds, callback);
		});
	}

	Frames.getAllFrames = function (offset, pageSize, callback) {

		//Get list Frame in order
		db.getSortedSetRangeByScore('frames:created-date', 
										offset*pageSize, 
										pageSize, 
										0, '+inf',
										function (err, FrameIds) {
			//Get Frame object array								
			Frames.getFrames(FrameIds, callback);
		});
	}



}(module.exports));