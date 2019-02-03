'use strict';
/**
 * Database API
 * @class DatabaseAPI
 */
(function(module){
	var nconf = require('nconf'),
	//logger = require('./../logger'),
	session = require('express-session'),
	db, mongoClient;

	module.helpers = module.helpers || {};
	module.helpers.mongo = require('./mongo/helpers');

	module.init = function (callback) {
		callback = callback || function(){};
		try{
			var sessionStore;
			mongoClient = require('mongodb').MongoClient;

			if(nconf.get('mongo')){
				sessionStore = require('connect-mongo')(session);
			}
		} catch (err){
			console.error('Unable to initialize MongoDB! Is MongoDB installed? Error: ' + err.message);
			return callback(err);
		}

		var usernamePassword = '';
		if (nconf.get('mongo:username') && nconf.get('mongo:password')){
			usernamePassword = nconf.get('mongo:username') + ':' + nconf.get('mongo:password') + '@';
		}

		// Sensible defaults for Mongo, if not set
		if (!nconf.get('mongo:host')) {
			nconf.set('mongo:host', '127.0.0.1');
		}
		if (!nconf.get('mongo:port')) {
			nconf.set('mongo:port', 27017);
		}
		if (!nconf.get('mongo:database')) {
			nconf.set('mongo:database', 'objects');
		}

		var hosts = nconf.get('mongo:host');
		var ports = nconf.get('mongo:port').toString().split(',');
		var servers = [];

		for (var i = 0; i< hosts.length; i++){
			servers.push(hosts[i] + ':' + ports[i]);
		}

		var connString = `mongodb://${usernamePassword}${hosts}`;
		//logger.info('connString: '+ connString);
		console.log('connString: '+ connString);
		var connOptions = {
			server:{
				poolSize: parseInt(nconf.get('mongo:poolSize'),10) || 10
			}
		};

		mongoClient.connect(connString, connOptions, function (err, _db) {
			if (err){
				//logger.error("LeasChat could not connect to your Mongo database. Mongo returned the following error: " + err.message);
				console.error("LeasChat could not connect to your Mongo database. Mongo returned the following error: " + err.message);
				return callback(err);
			}
			//logger.info('Connected!');
			console.log('Connected!');
			db = _db;

			module.client = db;

			// TEMP: to fix connect-mongo, see https://github.com/kcbanner/connect-mongo/issues/161
			db.openCalled = true;
			module.sessionStore = new sessionStore({
				db: db
			});

			require('./mongo/main')(db, module);
			require('./mongo/hash')(db, module);
			require('./mongo/sets')(db, module);
			require('./mongo/sorted')(db, module);
			require('./mongo/list')(db, module);
			require('./mongo/group')(db, module);

			callback();
		})
	};

	module.info = function(db, callback) {
		db.stats({scale:1024}, function(err, stats) {
			if(err) {
				return callback(err);
			}

			stats.avgObjSize = (stats.avgObjSize / 1024).toFixed(2);
			stats.dataSize = (stats.dataSize / 1024).toFixed(2);
			stats.storageSize = (stats.storageSize / 1024).toFixed(2);
			stats.fileSize = (stats.fileSize / 1024).toFixed(2);
			stats.indexSize = (stats.indexSize / 1024).toFixed(2);
			stats.raw = JSON.stringify(stats, null, 4);
			stats.mongo = true;

			callback(null, stats);
		});
	};

	module.close = function() {
		db.close();
	};

}(exports));
