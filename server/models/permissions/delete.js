'use strict';

var async = require('async'),
	winston = require('winston'),
	utils = require('../../../public/js/utils'),
	db = require('../../database/mongo');

module.exports = function(Permissions) {

	Permissions.delete = function (permissionId, callback) {
		callback();
		
	}

};
