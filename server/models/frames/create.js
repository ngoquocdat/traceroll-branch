'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Frames){

	/**
	 * Create Frame document
	 * @param  {Int}   uid      User ID
	 * @param  {String}   type     Type of Frame. There are 2 types (image and text)
	 * @param  {String}   content  For text type this param is content, for image type is image's url
	 * @param  {Function} callback Callback function (err, FrameId)
	 * @return {Function}            Callback function
	 */
	Frames.create = function (ownerid, uid, stage, callback) {
		if (!uid){
			var errMessage = 'User is required';
			winston.info(errMessage);
			return callback(new Error(errMessage));
		}

		var now = Date.now();
		var FrameData = {
			'ownerid': ownerid,
			'data': stage,
			'created_by': uid,
			'modified_by': uid,
			'date_modified': now,
			'date_created': now
		}

		async.waterfall([
					function(next) {						
						FrameData.id = ownerid;
						//Saving Frame document to database
						db.setObject('frame:' + ownerid, FrameData, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetAdd('frames:created-date', now, FrameData.id, next);
							},
							function(next) {
								db.sortedSetAdd('user:'+ownerid+':frames', now, FrameData.id, next);
							}
						], next);
					}
				], function (err) {
					callback(err, "frame:"+FrameData.id);
				});
	}
};