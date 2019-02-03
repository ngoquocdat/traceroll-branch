"use strict";

var winston = require('winston');

/**
 * Database API
 * @class DatabaseAPI
 */
module.exports = function(db, module) {
	var helpers = module.helpers.mongo;

	module.searchIndex = function(key, data, id, callback) {
		callback = callback || function() {};
		var setData = {
			id: id
		};
		for(var field in data) {
			if (data.hasOwnProperty(field) && data[field]) {
				setData[field] = data[field].toString();
			}
		}

		db.collection('search' + key).update({id: id}, {$set: setData}, {upsert:true, w: 1}, function(err) {
			if(err) {
				winston.error('Error indexing ' + err.message);
			}
			callback(err);
		});
	};

	module.search = function(key, data, limit, callback) {
		var searchQuery = {};

		if (data.content) {
			searchQuery.$text = {$search: data.content};
		}

		if (Array.isArray(data.cid) && data.cid.length) {
		 	if (data.cid.length > 1) {
				searchQuery.cid = {$in: data.cid.map(String)};
			} else {
				searchQuery.cid = data.cid[0].toString();
			}
		}

		if (Array.isArray(data.uid) && data.uid.length) {
			if (data.uid.length > 1) {
				searchQuery.uid = {$in: data.uid.map(String)};
			} else {
				searchQuery.uid = data.uid[0].toString();
			}
		}

		db.collection('search' + key).find(searchQuery, {limit: limit}).toArray(function(err, results) {
			if (err) {
				return callback(err);
			}

			if (!results || !results.length) {
				return callback(null, []);
			}

			var data = results.map(function(item) {
				return item.id;
			});

			callback(null, data);
		});
	};

	module.searchRemove = function(key, id, callback) {
		callback = callback || helpers.noop;
		if (!id) {
			return callback();
		}
		db.collection('search' + key).remove({id: id}, function(err, res) {
			callback(err);
		});
	};

	module.flushdb = function(callback) {
		callback = callback || helpers.noop;
		db.dropDatabase(callback);
	};

	/**
	 * Check object exist of not
	 * @method exists
	 * @param  {String}   key      _key
	 * @param  {Function} callback Function callback
	 */
	module.exists = function(key, callback) {
		if (!key) {
			return callback();
		}
		db.collection('objects').findOne({_key: key}, function(err, item) {
			callback(err, item !== undefined && item !== null);
		});
	};

	/**
	 * Remove object from DB
	 * @method delete
	 * @param  {String}   key      _key
	 * @param  {Function} callback Function callback
	 */
	module.delete = function(key, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		db.collection('objects').remove({_key: key}, function(err, res) {
			callback(err);
		});
	};

	module.deleteObj = function(key, value, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		db.collection('objects').remove({_key: key,value:value}, function(err, res) {
			callback(err);
		});
	};
	module.deleteObjByScore = function(key, scoreValue, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		db.collection('objects').remove({_key: key,'score':scoreValue}, function(err, res) {
			callback(err);
		});
	};

	module.deleteAll = function(keys, callback) {
		callback = callback || helpers.noop;
		if (!Array.isArray(keys) || !keys.length) {
			return callback();
		}
		db.collection('objects').remove({_key: {$in: keys}}, function(err, res) {
			callback(err);
		});
	};

	module.get = function(key, callback) {
		if (!key) {
			return callback();
		}
		module.getObjectField(key, 'value', callback);
	};

	module.set = function(key, value, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		var data = {value: value};
		module.setObject(key, data, callback);
	};

	/**
	 * Increment 1 of value by object key
	 * @method increment
	 * @param  {String}   key      _key
	 * @param  {Function} callback Function Callback
	 */
	module.increment = function(key, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		db.collection('objects').findAndModify({_key: key}, {}, {$inc: {value: 1}}, {new: true, upsert: true}, function(err, result) {
			callback(err, result && result.value ? result.value.value : null);
		});
	};

	module.rename = function(oldKey, newKey, callback) {
		callback = callback || helpers.noop;
		db.collection('objects').update({_key: oldKey}, {$set:{_key: newKey}}, {multi: true}, function(err, res) {
			callback(err);
		});
	};

	module.expire = function(key, seconds, callback) {
		module.expireAt(key, Math.round(Date.now() / 1000) + seconds, callback);
	};

	module.expireAt = function(key, timestamp, callback) {
		module.setObjectField(key, 'expireAt', new Date(timestamp * 1000), callback);
	};

	module.pexpire = function(key, ms, callback) {
		module.pexpireAt(key, Date.now() + parseInt(ms, 10), callback);
	};

	module.pexpireAt = function(key, timestamp, callback) {
		module.setObjectField(key, 'expireAt', new Date(timestamp), callback);
	};

	module.setObjectSearch = function(key, data, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		
		db.collection('search_user_name').update({_key: key}, {$set: data}, {upsert: true, w: 1}, function(err) {
			callback(err);
		});
	};

	module.removeObjectSearch = function(key, value, callback){
		function done(err) {
			callback(err);
		}
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}

		const query = {_key: key, userid: value}
		db.collection('search_user_name').remove(query, done);

		/*if (Array.isArray(value)) {
			value = value.map(helpers.valueToString);
			db.collection('objects').remove({_key: key, value: {$in: value}}, done);
		} else {
			const query = {_key: key, value: value}
			db.collection('objects').remove(query, done);
		}*/
	};

	module.getListUserByInputSearch = function(contentSearch, callback){
		var content_reged = new RegExp(contentSearch,'i');
		var finalResults = [];
		
		db.collection('search_user_name').find({ _key: {$regex : content_reged}})
						.sort({"score": -1})
						.toArray(function(err, results){
							console.log(err, results);
							if(err){
								callback(err);
							}else{
								if(results.length > 0){
									results.map(function(items){
										if(finalResults.indexOf(items.userid) == -1){
											finalResults.push(items.userid);
										}
									})
									callback(null, finalResults);

									/*results = results.map(function(items){
										if(results.indexOf(items.userid) == -1){
											return items.userid;
										}
										// return items.userid;
									});
									callback(null, results);*/
									
								}else{
									callback(null, []);
								}
							}
						})
	};

	module.getSortedSetByValue = function(key, value, callback){
		var stringValue = value.toString();

		db.collection('objects').find({_key: key, value: stringValue})
								.toArray(function(err, results){
									if(err){
										callback(err);
									}else{
										if(results.length > 0){
											results = results.map(function(item){
												return item.score;
											})
											callback(null, results);
										}else{
											callback(null, []);
										}
									}
								})
	}
};