'use strict';

var nconf = require('nconf'),
	async = require('async'),
	db = require('../database/mongo'),
	Elements = require('./../models/elements');

nconf.argv()
    .env()
    .file({ file: '../../config.json' });

async.waterfall([
	function (next) {
		console.log('Init DB');
		db.init(next);
		
	},
	function (next) {
		return next();
		var data = [{uid:4,ownerid:4, type:'text', content:'Text 1', stage:{x:1,y:1, fontSize:30}},
					{uid:5,ownerid:5, type:'image', content:'http://localhost:8888/img/uploads/demo.jpg', stage:{x:1,y:1, width:100, height:100}},
					{uid:6,ownerid:6, type:'text', content:'Text 3 - Young, creative and passionate, we understand that the purposes of our solutions, first and foremost, are to contribute towards the success of clients. Hence, we engage in two-way communication with clients to define their marketing objectives and develop strategies that achieve desired results.', stage:{x:1,y:1, fontSize:30}},
					{uid:5,ownerid:5, type:'image', content:'http://localhost:8888/img/uploads/demo.jpg', stage:{x:1,y:1, width:100, height:100}},
					{uid:4,ownerid:4, type:'text', content:'Text 5', stage:{x:1,y:1, fontSize:30}},
					{uid:6,ownerid:6, type:'image', content:'http://localhost:8888/img/uploads/demo.jpg', stage:{x:1,y:1 , width:100, height:100}},
					{uid:6,ownerid:6, type:'image', content:'http://localhost:8888/img/uploads/demo.jpg', stage:{x:1,y:1 , width:100, height:100}}
					];

		data.forEach((item)=>{
			//ownerid, uid, type, content, stage, callback
		Elements.create(item.uid, item.ownerid, item.type, item.content, item.stage, function (err) {
			console.log(err);
			console.log("Inserted: ", item.content);
		});
		});
		next();
		
	},
	function (next){
		return next();
		Elements.update('element:11', 4, 'update item',{x:1, y:2, width: 10, height: 30}, next)
	},
	function (next){
		return next();
		Elements.getElementsByUser(5, 0, 1000, function (err,data) {
			console.log(data);
			next();
		})
	},
	function (next) {
			Elements.getElementsByUser(5,0,100,function (err, data) {
				console.log(data);
			});
	}], function(err){
	if (err){
		console.error("Error: " + err);
	}
});
