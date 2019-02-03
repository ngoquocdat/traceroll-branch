'use strict';

var async = require('async'),
    users = require('../users'),
    db = require('../../database/mongo')

module.exports = function(Users) {

    Users.addSocketConnection = function(userId, socketId, callback) {

        let now = Date.now()

        async.parallel([
            function(next) {
                db.sortedSetAdd(`user:${userId}:socket-connections`, now, socketId, next)
            },
        ], function(err) {
            callback(err)
        })
    }

    Users.removeSocketConnection = function(socketId, callback) {

        async.parallel([
            function(next) {
                db.sortedSetRemove(new RegExp('^user:\\d+:socket-connections$'), socketId, next)
            },
        ], function(err) {
            callback(err)
        })
    }

    Users.getSocketConnections = function(userId, callback) {

        async.parallel({
            connections: function(next) {
                db.getDocuments({_key: `user:${userId}:socket-connections`}, {}, next)
            },
        }, function(err, results) {
            if (err) {
                callback(err, [])
                return
            }
            callback(err, results.connections)
        })
    }
};