'use strict';

var async = require('async'),
	nconf = require('nconf'),
	helpers = require('./helpers'),
	users = require('./users'),
	db = require('../database/mongo');

(function(Elements){
	require('./elements/create')(Elements);
	require('./elements/update')(Elements);
	require('./elements/delete')(Elements);

	var fields = ['_key','type','content', 'content_video','ownerid','stage','created_by','modified_by','date_modified','date_created','id','caption'];
	var user_fields = ['username', 'userslug', 'userId', 'picture', 'fullname'];
	var comment_fields = ['_key', 'content', 'created_date', 'modified_date', 'created_by', 'modified_by'];
	
	/**
	 * Retrieve the element object by element id
	 * @param  {Number}   elementId Element id
	 * @param  {Function} callback  Callback function
	 * @return {Err, Object}             Param1: Error Message, Param2: Element objects
	 */
	Elements.getElementById = function (elementId, callback) {

		db.getObjectFields('element:'+elementId, fields, callback);
		
	}

	/**
	 * Retrieve list of elements by array of ids
	 * @param  {Array}   elementIds Array of element id
	 * @param  {Function} callback   Callback Function
	 * @return {Err, Array}              Param1: Error Message, Param2: Array of element objects
	 */
	Elements.getElements = function (elementIds, callback) {

		async.parallel({
			elements: function(next_parallel){
				var keys = helpers.buildKeys('element', elementIds);

				db.getObjectsFields(keys, fields, function (err, elements) {

					async.map(elements,(item, next)=>{
						async.parallel({
							ownerUser: function(next_parallel){
								users.getUserFields(item.ownerid, user_fields, next_parallel);
							},

							createdUser: function(next_parallel){
								users.getUserFields(item.created_by, user_fields, next_parallel);
							}

						}, function(err, results){
							item.owner = results.ownerUser;
							item.createdUser = results.createdUser;
							item.container = {'height': nconf.get('newsfeed:item:height') || 100}; //100px
							item.container = {'width': nconf.get('newsfeed:item:width') || 100}; //100px
							return next(err, item);
						})

					}, next_parallel);
				});
			},

			comments: function(next_parallel){
				Elements.getCommentIdsByElements(elementIds, function(err, commentIds){

					async.parallel({
						comment_info: function(next_parallel2){
							Elements.getCommentInfo(commentIds, next_parallel2);
						},

						comment_owner: function(next_parallel2){
							Elements.getCommentsUsers(commentIds, next_parallel2);
						}
					}, function(err, results){

						for(var i = 0; i < results.comment_info.length; i++){
							async.map(results.comment_info[i], function(item, next){
								var index = results.comment_info[i].indexOf(item);

								if(typeof results.comment_owner[i][index] !== 'undefined'){
									item.username = results.comment_owner[i][index].username;
									item.userslug = results.comment_owner[i][index].userslug;
									item.userId = results.comment_owner[i][index].userId;
									return next(err, item);
								}
							})
						}

						next_parallel(err, results.comment_info);
					})
				})
			},

			likesOfElement: function(next_parallel){
				Elements.getListUserLikedByElement(elementIds, function(err, listUserLikedByElement){
					next_parallel(err, listUserLikedByElement);
				})
			}

		}, function(err, results){
			var listUsersInfo = results.likesOfElement.listUsersInfo,
				listUsersId = results.likesOfElement.listUsersId;

			for(var i = 0; i < results.comments.length; i++){
				async.map(results.elements, function(element, next){
					var index = results.elements.indexOf(element);
					element.likeTimes = listUsersId[index].length;
					element.usersLikedElement = listUsersInfo[index];
					element.userLikedIds = listUsersId[index];
				})
				results.elements[i].comment = results.comments[i];
			}

			callback(err, results.elements);
		})

	}

	/**
	 * Getting user's element chronological
	 * @param  {Number}   userId   User ID
	 * @param  {Number}   offset   Page Index
	 * @param  {Number}   pageSize Size of each page
	 * @param  {Function} callback Return function
	 */
	Elements.getElementsByUser = function (userId, offset, pageSize, callback) {
		if (!userId){
			return callback(new Error('User ID is required'));
		}
		//Get list element ids chronological
		db.getSortedSetRevRangeByScore('user:'+userId+':elements', 
										offset*pageSize, 
										pageSize, 
										'+inf',0,
										function (err, elementIds) {
			Elements.getElements(elementIds, callback);
		});
	}

	// GET Elements for newsfeed
	Elements.getPagingElements = (userID,page,limit,callback)=>{
		db.getSortedSetRevRange('elements:created-date', 0, -1, (err, elementIds)=>{
			if (!elementIds || elementIds.length <= 0) {
				return callback(new Error('Element is null by user'));
			}
			else {
				db.getSortedSetRevRange(`user:${userID}:followings`,0,-1,(err,userIDs)=>{
					if (err) {
						return callback(new Error(JSON.stringify(err)))
					}
					else {
						Elements.getElements(elementIds, function(err, dataElements){
							let total = dataElements.length
							dataElements = dataElements.filter((item)=>{
								return userIDs.indexOf(item.ownerid)!==-1
							})
							dataElements = dataElements.slice((page-1)*limit, page*limit);
							var data = {
								"total" : total,
								"pageNum" : page,
								"pageSize" : limit,
								"elements" : dataElements,
							}
							callback(null, data);
						});
					}
				});
			}
		})
	}

	/**
	 * Retrieve array of elements
	 * @param  {Number}   offset   Page Index
	 * @param  {Number}   pageSize Page Size
	 * @param  {Function} callback Callback Function
	 * @return {Err, Array}            Param1: Error, Param2: Array of elements
	 */
	Elements.getAllElements = function (userId, pageSize, lastId1, lastId2, callback) {

        db.getNewsfeed(userId, pageSize, lastId1, lastId2, function(err, data) {
            Elements.getElements(data.elementIds, function(err, elements) {
                callback(err, {elements: elements, lastId1: data.lastId1, lastId2: data.lastId2})
            })
        })
	}

	/**
	 * Getting user's element chronological paging
	 * @param  {Number}   userId   User ID
	 * @param  {Number}   offset   Page Index
	 * @param  {Number}   pageSize Size of each page
	 * @param  {Function} callback Return function
	 */
	Elements.getElementsByUserPaging = function (userId, offset, pageSize, currentElementId, callback) {
		if (!userId){
			return callback(new Error('User ID is required'));
		}
		// Get list elements by UserId
		db.getSortedSetRevRange('user:'+userId+':elements', 0, -1, function(err, elementIds){
			// Get list elements by UserId & paging
			if (!elementIds || elementIds.length <= 0) {
				return callback(new Error('Element is null by user'));
			}
			else {
				var currentIndex = elementIds.indexOf(currentElementId + '');
				var startIndex = 0;
				var endIndex = elementIds.length;
				var totalElements = elementIds.length;
				var pageNum = 1;
				if (currentIndex < 0) {
					// console.log(offset);
					if(offset > 0) {
						pageNum = offset;
						startIndex = (offset - 1) * pageSize;
						if (pageSize * offset < elementIds.length) {
							endIndex = pageSize * offset - 1;
						}
					}
					else {
						startIndex = 0;
						if (pageSize < elementIds.length) {
							endIndex = pageSize - 1;
						}
					}
					var outElementsIds = elementIds.slice(startIndex, endIndex + 1);
					// console.log(elementIds);
					// console.log(outElementsIds);

					Elements.getElements(outElementsIds, function(err, dataElements){
						var data = {
							"total" : totalElements,
							"pageNum" : pageNum,
							"pageSize" : pageSize,
							"currentIndex": 0,
							"elements" : dataElements,
						}
						callback(null, data);
					});
				}
				else {
					pageNum = Math.floor(currentIndex / pageSize) + 1;
					startIndex = (pageNum - 1) * pageSize;
					if (pageSize * pageNum < elementIds.length) {
						endIndex = pageSize * pageNum - 1;
					}

					var outElementsIds = elementIds.slice(startIndex, endIndex + 1);
					// console.log(elementIds);
					// console.log(outElementsIds);
					Elements.getElements(outElementsIds, function(err, dataElements){
						var data = {
							"total" : totalElements,
							"pageNum" : pageNum,
							"pageSize" : pageSize,
							"currentIndex": currentIndex - startIndex,
							"elements" : dataElements,
						}
						callback(null, data);
					});
				}
			}
		});
	}

	Elements.getCommentIdsByElements = function(elementIds, callback){
		var _keys = helpers.buildKeys("element", elementIds, "comments");

		db.getSortedSetsMembers(_keys, function(err, commentIds){
			callback(err, commentIds);
		})
	}

	Elements.getCommentInfo = function(commentIds, callback){
		async.map(commentIds, function(array, next_array){

			if(array === []){
				return next_array(err, []);
			}else{
				var _keys = helpers.buildKeys('comment', array);

				db.getObjectsFields(_keys, comment_fields, function(err, results){
					return next_array(err, results);
				})
			}
		}, callback)
	}


	Elements.getCommentsUsers = function(commentIds, callback){

		async.map(commentIds, function(array, next_array){
			if(array === []){
				return next_array(err, []);
			}else{
				var _keys = helpers.buildKeys('comment', array, 'userid');

				db.getSortedSetsMembers(_keys, function(err, commentUserIds){
					var keys = helpers.buildKeys('user', commentUserIds);

					db.getObjects(keys, function(err, userObjects){
						return next_array(err, userObjects);
					})
				})
			}
		}, callback)
		
	}

	Elements.getListUserLikedByElement = function(elementIds, callback){
		var _keys = helpers.buildKeys('element', elementIds, 'likes');

		db.getSortedSetsMembers(_keys, function(err, listUserLikedByElement){
			async.map(listUserLikedByElement, function(userIds, next){
				users.getMultipleUserFields(userIds, user_fields,function(err, userInfo ){
					return next(err, userInfo);
				})
			}, function(err, results){
                var ListUserLikedByElement = {
                        listUsersInfo: results,
                        listUsersId: listUserLikedByElement
                }
                callback(err, ListUserLikedByElement);
            })
		})
	}


}(module.exports));