'use strict';

var async = require('async'),
	nconf = require('nconf'),
	helpers = require('./helpers'),
	users = require('./users'),
	db = require('../database/mongo');

(function(Configs){

	var fields = ['_key','value'];
	var user_fields = ['username', 'userslug', 'userId', 'picture', 'fullname'];

	/**
	 * Get all config
	 * @param  {Function} callback   Callback Function
	 */
	Configs.getConfig = function (callback) {

		var key = 'config';

		db.getObject(key, callback);
	}

	/**
	 * Save Config
	 * @param  {Object}   ConfigData Object of new config data
	 * @param  {Function} callback   Callback Function
	 */
	Configs.saveConfig = function (ConfigData, callback) {

		var key = 'config';

		db.setObject(key, ConfigData, callback);
	}



}(module.exports));