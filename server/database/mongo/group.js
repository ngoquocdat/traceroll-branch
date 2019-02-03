"use strict";

var winston = require('winston');
var async = require('async');

/**
 * Database API
 * @class DatabaseAPI
 */
module.exports = function(db, module) {
    var helpers = module.helpers.mongo;

    module.getReputationByTopic = function(tid,callback){
        var pipeline = [
            { $match:{$and:[{"tid":{$ne:null}},{"tid":{$in:[tid,tid.toString()]}}]}} ,
            { $group : { _id : "$tid",  reputation:{$sum:"$reputation"}}},
            { $group : { _id : null,  count:{$sum:"$reputation"}}},
            { $project: { _id: 0, count: '$count' } }
        ];

        db.collection('objects').aggregate(pipeline, function(err, results) {
            if (err) {
                return callback(err);
            }

            if (!Array.isArray(results)) {
                results = [];
            }
            var count = results[0].count;

            callback(null, count);
        });
    };
    module.getTopicsByCategoryId = function(cid,callback){
        var cid_String = cid.toString();
        var pipeline = [
            { $match:{$and:[{_key:/topic:/},{"cid":cid_String}]}} ,
            { $project : { _id:0, tid : 1  } }
        ];

        db.collection('objects').aggregate(pipeline, function(err, results) {
            if (err) {
                return callback(err);
            }
            if (!Array.isArray(results)) {
                results = [];
            }
            callback(null, results);
        });
    };

    module.getReputationByCategory = function(cid, callback){

        module.getTopicsByCategoryId(cid, function (err, topics) { // get a list of tid from cid
            var totalReputation = 0;
            //total loop count of each topic like
            async.forEach(topics,function(topic, callback){
                module.getReputationByTopic (topic.tid, function(err, reputation){

                    if (err){
                        return callback(err);
                    }

                    totalReputation = totalReputation +  reputation;


                    callback(); // tell async that the iterator has completed
                });
            },function(err){
                callback(null, totalReputation);
            });

        });
    }

    module.getTopicCountAndPostCountCategory = function(callback){

        var pipeline = [
            {$match:{_key:/.*category:.*/}},
            {$group:{_id:null, topic_count:{$sum:"$topic_count"}, post_count:{$sum:"$post_count"}}}
        ];
        db.collection('objects').aggregate(pipeline,function(err, results){
            if(err){
                return callback(err);
            }
            if (!Array.isArray(results)){
                results = [];
            }
            var topic_count = results[0].topic_count;
            var post_count = results[0].post_count;
            callback(null, topic_count,post_count);
        });
    };

    module.getUsersByUids = function(uids,callback){
        if (!Array.isArray(uids) || !uids.length) {
            return callback(null, []);
        }
        db.collection('objects').find({uid: {$in: uids},_key:/user:/}, {_id: 0,uid:1, picture: 1, username: 1}).toArray(function(err, data) {
            if (err) {
                return callback(err);
            }
            if (!Array.isArray(data)){
                data = [];
            }
            callback(null, data);
        });
    };

};