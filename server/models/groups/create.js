'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Groups) {

	Groups.create = function (data, callback) {
		if (!data.name){
			return callback('Group name is required');
		}
		var groupData = {
				'dateCreated' : Date.now(),
				'deleted' : 0,
				'description' : data.description || data.name,
				'hidden' : data.hidden || 0,
				'memberCount' : 0,
				'name' : data.name,
				'private' : '1',
				'slug' : data.name || '',
				'system' : '1',
				'userTitle' : '',
				'date_modified' : Date.now()
		};
		var _key = 'group:' + data.name;

		async.parallel([
				function (next){
					db.setObject(_key, groupData, next);
				},
				function (next) {
					db.sortedSetAdd('groups:createdDate', Date.now(), data.name, next);
				}
			], function (err) {
			if(err){
				winston.error(err);
				callback(err);
			}else{
				winston.info('New group is created successfully');
				callback();
			}
		});
		
	}

	Groups.getListGroups = function(callback)
	{

	  	var listGroupId = [];
        var keyGroup = "groups:createdDate";
        var start = 0;
	      
        db.getObjectValue(keyGroup, function(err, data){
            if (err){
                return callback(err,[]);
            }
           	else
		    {
			    //sort user
			    db.getSortedSetRevRangeWithScores(keyGroup,start,data.length,function (err,resultData) {
			     	async.each(resultData, function (item, callback) {
				      	listGroupId.push('group:'+item.value);
				      	callback();
				     },
			     	function (err) {
				      	if (err) {
				       		console.log("Error happened");
				      	}
				     	else {
				       		//get group				       		
							db.getObjects(listGroupId,function(err,listGroups){
						    	if(err)
						    	{
						    		callback(err);
						    	}
						    	else{
						    		callback(null,listGroups)
						    	}
						    });
				      	}
			     	}
			    )});
			}
	    });
	}

	Groups.getListMultiSelectGroups = function(callback)
	{

	  	var listGroupId = [];
        var keyGroup = "groups:createdDate";
        var start = 0;
	      
        db.getObjectValue(keyGroup, function(err, data){
            if (err){
                return callback(err,[]);
            }
           	else
		    {
			    //sort user
			    db.getSortedSetRevRangeWithScores(keyGroup,start,data.length,function (err,resultData) {
			     	async.each(resultData, function (item, callback) {
				      	listGroupId.push('group:'+item.value);
				      	callback();
				     },
			     	function (err) {
				      	if (err) {
				       		console.log("Error happened");
				      	}
				     	else {
				       		//get group				       		
							db.getObjects(listGroupId,function(err,listGroups){
						    	if(err)
						    	{
						    		callback(err);
						    	}
						    	else{

						    		var listGroup = [];
							        async.each(listGroups, function (item, callback) {
							     		var group = {
					        				'Text': item.name,
					        				'Value': item.name,
							        	}
					    				listGroup.push(group);
					    				callback();


							        },
							        function(err){
							        	
							        	callback(null,listGroup);
							        });
						    	}
						    });
				      	}
			     	}
			    )});
			}
	    });
	}

};
