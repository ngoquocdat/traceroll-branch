'use strict';

var async = require('async'),
    users = require('../users'),
    db = require('../../database/mongo')

module.exports = function(Users) {

    Users.followDetail = function(ownerid, callback) {
        async.parallel({
            followings: function(next) {
                db.getDocuments({_key: `user:${ownerid}:followings`}, {_id: 0}, next);
            },
            followers: function(next) {
                db.getDocuments({_key: `user:${ownerid}:followers`}, {_id: 0}, next);
            }
        }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(err, result);
            }
        })
    }

    Users.checkFollower = function(userId, followerId, callback) {
        async.parallel({
            followers: function(next) {
                db.getDocuments({_key: 'user:' + userId + ':followers', value: followerId}, {}, next);
            }
        }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                const length = result.followers.length
                callback(err, length > 0);
            }
        })
    }

    Users.follow = function(follower, following, callback) {
        const data = {
            score: Date.now(),
            permission: false
        }
        const notification = {
            type: 'follow',
            permission: false,
            enable: true,
        }
        async.waterfall([
            function(next) {
                db.setObjectValueId('user:'+follower+':followings', data, following, next);
            },
            function(next) {
                db.setObjectValueId('user:'+following+':followers', data, follower, next);
            },
            function(next) {
                Users.createFollowNotification(following, follower, notification, next)
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

    Users.unfollow = function(follower, following, callback) {
        async.parallel([
            function(next) {
                db.removeDocuments({_key: `user:${follower}:followings`, value: following}, next);
            },
            function(next) {
                db.removeDocuments({_key: `user:${following}:followers`, value: follower}, next);
            },
            function(next) {
                Users.updateFollowNotification(following, follower, next);
            },
        ], function(err) {
            callback(err);
        })
    }

    Users.updatePermission = function(params, callback) {
        const notiId = params.notificationId,
            following = params.followingId,
            follower = params.followerId,
            isAllow = params.permission
        const data = {
                permission: params.permission
            }
        const notification = {
            type: isAllow == true ? 'allow' : 'disallow',
        }
        async.parallel({
            A: function(next) {
                db.updateDocById(notiId, data, next)
            },
            B: function(next) {
                db.setObjectValueId(`user:${following}:followers`, { permission: isAllow }, follower, next)
            },
            function(next) {
                db.setObjectValueId(`user:${follower}:followings`, { permission: isAllow }, following, next)
            },
            notification: function(next) {
                Users.createNotificationUpdatePermission(following, follower, notification, next)
            },
        }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                const notiIds = result.notification.insertedIds
                if (notiIds.length > 0) {
                    callback(err, notiIds[0]);
                } else {
                    callback(err, "");
                }
            }
        })
    }

    Users.checkPermission = function(userId, ownerId, callback){
        if (userId && ownerId && userId == ownerId) {
            callback(err, true);
            return
        }
        async.parallel({
            followers: function(next) {
                db.getDocuments({_key: 'user:' + ownerId + ':followers', value: userId}, {}, next);
            }
        }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(err, result.followers.length > 0 && result.followers[0].permission);
            }
        })
    }
};