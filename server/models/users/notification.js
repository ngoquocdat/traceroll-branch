'use strict';

var async = require('async'),
    validator = require('validator'),
    utils = require('../../../public/js/utils'),
    users = require('../users'),
    db = require('../../database/mongo'),
    fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    helpers = require('./../helpers');

module.exports = function(Users) {

    Users.createFollowNotification = function(followingId, followerId, data, callback) {
        let now = Date.now();

        async.waterfall([
            function(next) {
                db.getObject(`user:${followerId}`, next)
            },
            function(user, next) {
                data._key = `user:${followingId}:notifications:follow`
                data.user = {
                    username: user.username,
                    userId: user.userId,
                    image: user.picture
                }
                data.value = user.userId
                data.score = now
                db.insertObject(data, next);
            },
        ], function(err, notification) {
            callback(err, notification);
        })
    }

    Users.updateFollowNotification = function(followingId, followerId, callback) {
        async.waterfall([
            function(next) {
                const data = {
                    enable: false
                }
                db.setObjectValueId(`user:${followingId}:notifications:follow`, data, followerId, next)
            },
        ], function(err) {
            callback(err);
        })
    }

    Users.createNotificationUpdatePermission = function(followingId, followerId, data, callback) {
        const now = Date.now(),
            suffix = data.type

        async.waterfall([
            function(next) {
                db.getObject(`user:${followingId}`, next)
            },
            function(user, next) {
                data._key = `user:${followerId}:notifications:${suffix}`
                data.user = {
                    username: user.username,
                    userId: user.userId,
                    image: user.picture
                }
                data.value = user.userId
                data.score = now
                db.insertObject(data, next);
            },
        ], function(err, notification) {
            callback(err, notification);
        })
    }

    Users.createNotification = function(userId, params, callback) {
        const data = {
                type: params.type,
                element: params.element
            },
            receiverId = params.receiverId
        const now = Date.now(),
            suffix = data.type

        async.waterfall([
            function(next) {
                db.getObject(`user:${userId}`, next)
            },
            function(user, next) {
                data._key = `user:${receiverId}:notifications:${suffix}`
                data.user = {
                    username: user.username,
                    userId: user.userId,
                    image: user.picture
                }
                data.value = user.userId
                data.score = now
                db.insertObject(data, next);
            },
        ], function(err, notification) {
            if (err) {
                callback(err);
            } else {
                const notiIds = notification.insertedIds
                if (notiIds.length > 0) {
                    callback(err, notiIds[0]);
                } else {
                    callback(err, "");
                }
            }
        })
    }

    Users.loadNotifications = function(userId, callback) {
        async.parallel({
            notifications: function(next) {
                db.getObjectsIncludeId([new RegExp(`^user:${userId}:notifications`)], {score: -1}, next)
            },
        }, function(err, results) {
            callback(err, results);
        })
    }
};