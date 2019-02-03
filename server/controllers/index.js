'use strict';

var async = require('async'),
	users = require('./../models/users'),
	nconf = require('nconf');
	

var Controllers = {
	static: require('./static'),
	api: require('./api'),
	uploadHelper: require('./uploadHelpers'),

};

Controllers.index = function (request, response, next) {
	
	response.render('index', {title: 'index'});
}

Controllers.login = function (request, response, next) {
	
	response.render('login', {title: 'login'});
}



module.exports = Controllers;