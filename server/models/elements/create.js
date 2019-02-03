'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Elements){

	/**
	 * Create element document
	 * @param  {Int}   uid      User ID
	 * @param  {String}   type     Type of element. There are 2 types (image and text)
	 * @param  {String}   content  For text type this param is content, for image type is image's url
	 * @param  {Function} callback Callback function (err, elementId)
	 * @return {Function}            Callback function
	 */
	Elements.create = function (ownerid, uid, type, content, stage, key, caption, callback) {
		if (!uid){
			var errMessage = 'User is required';
			winston.info(errMessage);
			return callback(new Error(errMessage));
		}

		var now = Date.now();
		var elementData = {
			'type': type,
			'content': content,
			'caption': caption,
			'ownerid': ownerid,
			'stage': stage,
			'created_by': uid,
			'modified_by': uid,
			'date_modified': now,
			'date_created': now
		}

		async.waterfall([
					function(next) {
						console.log(elementData);
						//Getting available element ID
						//db.incrObjectField('global', 'nextElementId', next);
						if (!key){
							next(null, uid + "-" +Date.now());
						}else{
							next(null, key);
						}
					},
					function(elementId, next) {						
						elementData.id = elementId;
						//Saving element document to database
						db.setObject('element:' + elementId, elementData, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetAdd('elements:created-date', now, elementData.id, next);
							},
							function(next) {
								db.sortedSetAdd('user:'+ownerid+':elements', now, elementData.id, next);
							},
							function(next){

								if(ownerid !== uid){
									db.sortedSetAdd('user:'+uid+':own-elements', now, elementData.id, next);
								}else{
									next();
								}
							}
						], next);
					}
				], function (err) {
					var id_element = "element:"+elementData.id,
						dataElement = {
							id: id_element,
							data: elementData
						}
					// callback(err, "element:"+elementData.id);
					callback(err, dataElement);
				});
	}

	//Create element video
	Elements.createVideo = function (ownerid, uid, type, content_thumb, content_video, path, pathThumb, stage, key, caption, callback) {
		if (!uid){
			var errMessage = 'User is required';
			winston.info(errMessage);
			return callback(new Error(errMessage));
		}

		var now = Date.now();
		var elementData = {
			'type': type,
			'content': content_thumb,
			'content_video': content_video,
			'path': path,
			'pathThumb': pathThumb,
			'caption': caption,
			'ownerid': ownerid,
			'stage': stage,
			'created_by': uid,
			'modified_by': uid,
			'date_modified': now,
			'date_created': now
		}

		async.waterfall([
					function(next) {
						console.log(elementData);
						if (!key){
							next(null, uid + "-" +Date.now());
						}else{
							next(null, key);
						}
					},
					function(elementId, next) {
						elementData.id = elementId;
						//Saving element document to database
						db.setObject('element:' + elementId, elementData, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetAdd('elements:created-date', now, elementData.id, next);
							},
							function(next) {
								db.sortedSetAdd('user:'+ownerid+':elements', now, elementData.id, next);
							}
						], next);
					}
				], function (err) {
					var id_element = "element:"+elementData.id,
						dataElement = {
							id: id_element,
							data: elementData
						}
					callback(err, dataElement);
				});
	}

	//Create comment element
	Elements.createComment = function(content, userID, elementID, callback){
		var commentID = Date.now();
		var now = Date.now();
		var commentData = {
							'content': content,
							'created_date': now,
							'modified_date': now,
							'created_by': userID,
							'modified_by': userID
						};

		async.waterfall([
			function(next){
				db.setObject('comment:'+commentID, commentData, next);
			},

			function(next){
				db.sortedSetAdd('comment:'+commentID+':userid', now, userID, next);
			},

			function(next){
				db.sortedSetAdd('comment:'+commentID+':elementid', now, elementID, next);
			},

			function(next){
				db.sortedSetAdd(elementID+":comments", now, commentID.toString(), next);
			},

			function(next){
				// db.sortedSetAdd('user:'+userID+':comments', now, 'comment:'+commentID.toString(), next);
				db.sortedSetAdd('user:'+userID+':comments', now, commentID.toString(), next);
			}

		], function(err){
			var createdComment = {
					id: "comment:"+commentID,
					data: commentData
				}
			callback(err, createdComment);
		})
	}

	// Add like 
	Elements.increaseLikeByElement = function(elementID, userID, callback){
		var now = Date.now();

		async.parallel([
			function(next){
				db.sortedSetAdd('user:'+userID+':like-elements', now, elementID, next);
			},

			function(next){
				db.sortedSetAdd(elementID+':likes', now, userID, next);
			}
		], function(err){
			if(err){
				callback(new Error(err));
			}else{
				var elementLiked = {
					element: elementID
				}

				callback(err, elementLiked);	
			}
		})
	}
};