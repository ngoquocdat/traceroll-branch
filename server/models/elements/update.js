'use strict';

var async = require('async'),
	winston = require('winston'),
	_ = require('underscore'),
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
	Elements.update = function (_key, uid, type, content, stage, callback) {
		if (!uid){
			var errMessage = 'User is required';
			winston.info(errMessage);
			return callback(new Error(errMessage));
		}

		var now = Date.now();
		var elementData = {};
		async.waterfall([
					function(next) {
						//Getting available element ID
						db.getObject(_key, next);
					},
					function(oldElement, next) {
						if (!oldElement){
							return callback(new Error('[[NO_DATA_FOUND]]'));
						}

						elementData = oldElement;
						elementData['content'] = content || elementData['content'];

						//If update the line if position changed
						if (stage && stage.newPos){
							let newPos = stage.newPos;
							elementData['stage']['x'] = newPos.x;
							elementData['stage']['y'] = newPos.y;
						}else{
							elementData['stage'] = stage;
						}
						elementData['modified_by'] = uid;			
						elementData['date_modified'] = now;			
						//Update element document to database

						db.setObject(_key, elementData, next);
					},
					function(next) {
						async.parallel([
							function(next) {
								db.sortedSetRemove('elements:updated-date', elementData.id, function(){
									db.sortedSetAdd('elements:updated-date', now, elementData.id, next);
								});
							},
							function(next) {
								return next();
								db.sortedSetRemove('user:'+elementData.ownerid+':elements', elementData.id, function(){
									db.sortedSetAdd('user:'+elementData.ownerid+':elements', now, elementData.id, next);
								});
							}
						], next);
					}
				], callback);
	}
};