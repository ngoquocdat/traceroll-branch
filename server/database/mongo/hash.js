"use strict";

var winston = require('winston');
var _ = require('underscore');
var async = require('async');
var { ObjectId } = require('mongodb')

/**
 * Database API
 * @class DatabaseAPI
 */
module.exports = function(db, module) {
	var helpers = module.helpers.mongo;

	/**
	 * Update or Insert a document by _key field
	 * @method setObject
	 * @param  {String}   key      _key field
	 * @param  {Object}   data     data as object
	 * @param  {Function} callback Callback function
	 */
	module.setObject = function(key, data, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		
		db.collection('objects').update({_key: key}, {$set: data}, {upsert: true, w: 1}, function(err) {
			callback(err);
		});
	};

	module.setObjectField = function(key, field, value, callback) {
		callback = callback || helpers.noop;
		if (!field) {
			return callback();
		}
		
		var data = {};
		field = helpers.fieldToString(field);
		data[field] = value;
		module.setObject(key, data, callback);
	};

	module.insertObject = function (data, callback) {
		callback = callback || helpers.noop;
		if (!data) {
			return callback();
		}
		
			db.collection('objects').insert(data, function(err, docInserted) {
				callback(err, docInserted);
			});
	
	};

	module.setObjectValueId = function(key, data, valueId,callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		
		db.collection('objects').updateMany({_key: key, value: valueId}, {$set: data}, {upsert: true, w: 1}, function(err) {
			callback(err);
		});
	};

	module.setObjectFieldValueId = function(key, field, value,valueId ,callback) {
		callback = callback || helpers.noop;
		if (!field) {
			return callback();
		}
		
		var data = {};
		field = helpers.fieldToString(field);
		data[field] = value;
		module.setObjectValueId(key, data,valueId, callback);
	};

	module.searchObject = function(key,data,field ,callback) {
		if (!key) {
			return callback();
		};
		data = '/^'+data +'/';
		//console.log(data);
		db.collection('objects').find({_key: key}, {field:  { $regex: data }}, callback);
	};

	module.searchTours = function (key, data, fields, limit, callback) {
		callback = callback || helpers.noop;

		var searchQuery = {};

		searchQuery._key = new RegExp(key, 'i');

		if (!Array.isArray(fields)){
			fields = [fields];
		}

		if (!Array.isArray(data)){
			data = [data];
		}
		var where = {};
		for (var i=0; i< data.length; i++){

			if (data[i].searchType){
					//In case search properly
				if (data[i].searchType == 'eq'){
					searchQuery[data[i].fieldName]  = data[i].value;
				}else if (data[i].searchType == 'regex'){
					//In case search regular expression /^..$/
					searchQuery[data[i].fieldName] = new RegExp(data[i].value,'i');
				}else{
					//In case between min and max values
				var obj = {};
				var value = data[i].value;
				if (parseInt(value,10) != NaN){
						value = parseInt(value,10);
					}
				obj['$'+data[i].searchType] = value;
				if (where[data[i].fieldName] == undefined){
					where[data[i].fieldName] = {};
				}

					where[data[i].fieldName]  = _.extend(where[data[i].fieldName], obj);
				}

			}


		}
		for (var item in where){
			searchQuery[item] = where[item];
		}
		
		db.collection('objects').find(searchQuery, {limit: limit, fields: fields}).toArray(function (err, results) {
			if (err) {
				return callback(err);
			}

			if (!results || !results.length) {
				return callback(null, []);
			}


			async.map(results, function (tour, next) {
				return next(null, tour.id.toString());
			}, function (err, tourIds) {
				callback(err, tourIds);
			});
		});
	}

	module.getObject = function(key, callback) {
		if (!key) {
			return callback();
		}
		db.collection('objects').findOne({_key: key}, {_id: 0, _key: 0}, callback);
	};

	module.getDocuments = function(query, fields, callback) {
		if (!query) {
			return callback();
		}
		db.collection('objects').find(query, fields).toArray((err, data) => {
			callback(err, data)
		});
	};

	module.removeDocuments = function(query, callback) {
		if (!query) {
			return callback();
		}
		console.log('removeDocuments', query)
		db.collection('objects').remove(query, function(err, res){
			callback(err);
		});
	};

	module.getObjectById = function(id, callback) {
		if (!id) {
			return callback();
		}
		db.collection('objects').findOne({_id: ObjectId(id)}, callback);
	};

	module.updateDocById = function(id, data, callback) {
		if (!id) {
			return callback();
		}
		db.collection('objects').update({_id: ObjectId(id)}, {$set: data}, callback);
	};
	
	module.getObjectValue = function(key, callback) {
		if (!key) {
			return callback();
		}
		db.collection('objects').find({_key: key})
		.toArray(function(err, data) {
				
				if (err || !data) {
					return callback(err);
				}

				
					data = data.map(function(item) {
						return item.value;
					});	
				callback(null, data);
			});;
	};
	
	module.getObjects = function(keys, callback) {
		if (!Array.isArray(keys) || !keys.length) {
			return callback(null, []);
		}
		db.collection('objects').find({_key: {$in: keys}}, {_id: 0}).toArray(function(err, data) {
			if(err) {
				return callback(err);
			}
			var map = helpers.toMap(data);
			var returnData = [];

			for(var i=0; i<keys.length; ++i) {
				returnData.push(map[keys[i]]);
			}

			callback(null, returnData);
		});
	};
	
	module.getObjectsIncludeId = function(keys, sort, callback) {
		if (!Array.isArray(keys) || !keys.length) {
			return callback(null, []);
		}
		db.collection('objects').find({_key: {$in: keys}}).sort(sort).toArray(function(err, data) {
			if(err) {
				return callback(err);
			}
			callback(null, data);
		});
	};

	module.getObjectField = function(key, field, callback) {
		if (!key) {
			return callback();
		}
		field = helpers.fieldToString(field);
		var _fields = {
			_id: 0
		};
		_fields[field] = 1;
		db.collection('objects').findOne({_key: key}, {fields: _fields}, function(err, item) {
			if (err || !item) {
				return callback(err, null);
			}

			callback(null, item[field] || null);
		});
	};

	module.getObjectFields = function(key, fields, callback) {
		if (!key) {
			return callback();
		}
		var _fields = {
			_id: 0
		};

		for(var i=0; i<fields.length; ++i) {
			fields[i] = helpers.fieldToString(fields[i]);
			_fields[fields[i]] = 1;
		}
		
		db.collection('objects').findOne({_key: key}, {fields: _fields}, function(err, item) {
			if (err) {
				return callback(err);
			}
			item = item || {};
			var result = {};
			for(i=0; i<fields.length; ++i) {
				result[fields[i]] = item[fields[i]] !== undefined ? item[fields[i]] : null;
			}
			callback(null, result);
		});
	};

	module.getObjectsFields = function(keys, fields, callback) {
		if (!Array.isArray(keys) || !keys.length) {
			return callback(null, []);
		}
		var _fields = {
			_id: 0,
			_key: 1
		};

		for(var i=0; i<fields.length; ++i) {
			fields[i] = helpers.fieldToString(fields[i]);
			_fields[fields[i]] = 1;
		}

		db.collection('objects').find({_key: {$in: keys}}, {fields: _fields}).toArray(function(err, items) {
			if (err) {
				return callback(err);
			}

			if (items === null) {
				items = [];
			}

			var map = helpers.toMap(items);
			var returnData = [],
				index = 0,
				item;

			for (var i=0; i<keys.length; ++i) {
				item = map[keys[i]] || {};

				for (var k=0; k<fields.length; ++k) {
					if (item[fields[k]] === undefined) {
						item[fields[k]] = null;
					}
				}

				returnData.push(item);
			}

			callback(null, returnData);
		});
	};

	module.getObjectKeys = function(key, callback) {
		module.getObject(key, function(err, data) {
			callback(err, data ? Object.keys(data) : []);
		});
	};

	module.getObjectValues = function(key, callback) {
		module.getObject(key, function(err, data) {
			if(err) {
				return callback(err);
			}

			var values = [];
			for(var key in data) {
				if (data && data.hasOwnProperty(key)) {
					values.push(data[key]);
				}
			}
			callback(null, values);
		});
	};

	module.isObjectField = function(key, field, callback) {
		if (!key) {
			return callback();
		}
		var data = {};
		field = helpers.fieldToString(field);
		data[field] = '';
		db.collection('objects').findOne({_key: key}, {fields: data}, function(err, item) {
			callback(err, !!item && item[field] !== undefined && item[field] !== null);
		});
	};

	module.isObjectFields = function(key, fields, callback) {
		if (!key) {
			return callback();
		}

		var data = {};
		fields.forEach(function(field) {
			field = helpers.fieldToString(field);
			data[field] = '';
		});

		db.collection('objects').findOne({_key: key}, {fields: data}, function(err, item) {
			if (err) {
				return callback(err);
			}
			var results = [];

			fields.forEach(function(field, index) {
				results[index] = !!item && item[field] !== undefined && item[field] !== null;
			});

			callback(null, results);
		});
	};

	module.deleteObjectField = function(key, field, callback) {
		module.deleteObjectFields(key, [field], callback);
	};

	module.deleteObjectFields = function(key, fields, callback) {
		callback = callback || helpers.noop;
		if (!key || !Array.isArray(fields) || !fields.length) {
			return callback();
		}
		fields = fields.filter(Boolean);
		if (!fields.length) {
			return callback();
		}

		var data = {};
		fields.forEach(function(field) {
			field = helpers.fieldToString(field);
			data[field] = '';
		});

		db.collection('objects').update({_key: key}, {$unset : data}, function(err, res) {
			callback(err);
		});
	};

	module.incrObjectField = function(key, field, callback) {
		module.incrObjectFieldBy(key, field, 1, callback);
	};

	module.decrObjectField = function(key, field, callback) {
		module.incrObjectFieldBy(key, field, -1, callback);
	};

	module.incrObjectFieldBy = function(key, field, value, callback) {
		callback = callback || helpers.noop;
		if (!key) {
			return callback();
		}
		var data = {};
		field = helpers.fieldToString(field);
		data[field] = value;

		db.collection('objects').findAndModify({_key: key}, {}, {$inc: data}, {new: true, upsert: true}, function(err, result) {
			callback(err, result && result.value ? result.value[field] : null);
		});
	};
};