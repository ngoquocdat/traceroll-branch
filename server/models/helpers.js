'use strict';

var async = require('async'),
	nconf = require('nconf'),
	_ = require('underscore'),
	util = require('util');

(function (Helpers) {

	/*Build list key as format [prefix:id:sufix]*/
	Helpers.buildKeys = function (prefix, ids, sufix) {
		if (!Array.isArray(ids) || !ids.length){
					return [];
		}
		
		return ids.map(function (id) {
			return Helpers.buildKey(prefix, id, sufix);
		});
	}

	Helpers.buildKeysNoPrefix = function (ids, sufix) {
		if (!Array.isArray(ids) || !ids.length){
					return [];
		}
		
		return ids.map(function (id) {
			return Helpers.buildKeyNoPrefix(id, sufix);
		});
	}

	/*Build key string as prefix:id:sufix*/
	Helpers.buildKey = function (prefix, id, sufix) {
		if (!prefix || !id){
			return '';
		}

		var _sufix = '';
		if (sufix){
			_sufix = util.format(':%s', sufix);
		}

		return util.format('%s:%s%s', prefix, id, _sufix);

	}

	Helpers.buildKeyNoPrefix = function (id, sufix) {
		if (!id){
			return '';
		}

		var _sufix = '';
		if (sufix){
			_sufix = util.format(':%s', sufix);
		}

		return util.format('%s%s', id, _sufix);

	}

	Helpers.removeArray = function(array, arrayRemove, callback) {
			var arrNew = [];
			async.waterfall([
			function (next) {
				arrNew = _.filter(array, function (item) {
							return _.indexOf(arrayRemove, item) < 0;
						});
				next();

			}

			],function (err){
				if (!err)
					callback(null,arrNew);
			});
	}

	Helpers.isCheckItemArray = function(array, item, callback) {

			var isCheckItem = false;
			if(_.indexOf(array, item) < 0)
			{
				callback(null,false);
			}
			else{
				callback(null,true);
			}
	}


	Helpers.unionArray = function(array, arrayUnion, callback) {
			var arrNew = [];
			async.waterfall([
			function (next) {
				arrNew = _.union(array, arrayUnion);
						
				next();

			}

			],function (err){
				if (!err)
					callback(null,arrNew);
			});
	}
	Helpers.convertDate = function(Unixdate, callback) {
		if(Unixdate != undefined || undefined != '')
		{
			
			var date = new Date();
			date.setTime(Unixdate);
			
			var formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);

			callback(null,formattedDate);
		}
		else
		{

			callback(null,'err');
		}
	}

	Helpers.convertDateNoTime = function(Unixdate, callback) {
		if(Unixdate != undefined || undefined != '')
		{
			
			var date = new Date();
			date.setTime(Unixdate);
			
			var formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() ;

			callback(null,formattedDate);
		}
		else
		{

			callback(null,'err');
		}
	}

})(exports);