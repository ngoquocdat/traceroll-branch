'use strict';

var async = require('async'),
	workspaces = {},
	db = require('./../../database/mongo');


workspaces.save = function(userslug,data,next){
	data.stage = JSON.parse(data.stage);
	var new_data = {};
	new_data.value = data;
	db.setObject('user:'+userslug+':workspace',new_data,function(err){
		if (!err) {
			var response = {
				status: "SUCCESS"
			}
			next(null);
		}
		else {
			next(err);
		}
	});
}

workspaces.get = function(userslug,next){
	db.getObjects([/element:/],function(err,data){
		if (!err) {
			var response = {
				status: "SUCCESS",
				data:data
			}
			next(null,data);
		}
		else {
			next(err);
		}
	});
}

module.exports = workspaces;
