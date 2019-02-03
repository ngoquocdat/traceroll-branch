"use strict";
/*global require, global, process*/

var nconf = require('nconf'),
	path = require('path'),
	url = require('url'),
	pkg = require('./package.json'),
	async = require('async');

nconf.argv().env('__');
global.env = process.env.NODE_ENV || 'development';

// Alternate configuration file support
var	configFile = path.join(__dirname, '/config.json');

//Load configuration from congin.json file
function loadConfig() {
							
	nconf.file({
		file:configFile
	});
	nconf.defaults({
		base_dir: __dirname,
		views_dir: path.join(__dirname, 'build'),
		version: pkg.version
	});
}


//Start server
function start(){
	loadConfig();

	var urlObject = url.parse(nconf.get('url'));
	nconf.set('urlObject', urlObject);
	var relativePath = urlObject.pathname !== '/' ? urlObject.pathname : '';

	// nconf defaults, if not set in config
	if (!nconf.get('upload_path')) {
		nconf.set('upload_path', '/public/img/uploads');
	}

	nconf.set('relative_path', relativePath);
	nconf.set('__dirname', __dirname);

	async.waterfall([
			function (next) {
				//Data configuration
				require('./server/database/mongo').init(next);
			},
			function (next) {
				var webserver = require('./server/webserver');
				//Start server and routing configurations
				webserver.listen();
				next();
			}
		], function (err) {
			if (err) {
				console.error('Error in app.js: ' + err);
				process.exit();
			}
		});
}

start();