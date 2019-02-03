'use strict';

var async = require('async'),
    validator = require('validator'),
    utils = require('../../../public/js/utils'),
    users = require('../users'),
    db = require('../../database/mongo'),
    fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    winston = require('winston'),
    helpers = require('./../helpers');

module.exports = function(Users) {

    /*DELETE USER NON-REGISTER VIA EMAIL TOKEN*/
    Users.deleteNonRegistUser = function(tokenNonRegist, callback){
        var _keyToken = helpers.buildKey('token', tokenNonRegist, 'non-registration');

        db.getSortedSetRange(_keyToken, 0, -1, function(err, nonRegisterEmail){
            winston.info('nonRegisterEmail: ', nonRegisterEmail[0]);
            if(err){
                callback(err);
            }else{

                db.getSortedSetByValue('email:uid', nonRegisterEmail, function(err, nonRegisterId){
                    winston.info('nonRegisterId: ', nonRegisterId[0]);
                    if(err){
                        callback(err);
                    }else if(nonRegisterId[0] !== undefined){
                        var userFields = ["username"];
                        var _key = helpers.buildKey('user', nonRegisterId[0]);

                        db.getObjectFields(_key, userFields, function(err, nonRegisterFields){
                            winston.info('nonRegisterRepresentName: ', nonRegisterFields);
                            if(err){
                                callback(err);
                            }else{
                                const userDeleteInfo = {
                                    user_email: nonRegisterEmail[0],
                                    user_name: nonRegisterFields.username,
                                    user_id: nonRegisterId[0]
                                }
                                winston.info('userDeleteInfo: ', userDeleteInfo);
                                
                                async.parallel([
                                    function(next){
                                        users.deleteUser(userDeleteInfo, next);
                                    },
                                    function(next){
                                        db.delete(_keyToken, next);
                                    }
                                ], function(err){
                                    if(err){
                                        callback(new Error(err));
                                    }else{
                                        callback();
                                    }
                                })
                                
                            }
                        })
                    }else{
                        callback(new Error('non-register id not exist'));
                    }
                })
            }
        }); 
    }

    Users.deleteUser = function(userDeleteInfo, callback) {
        winston.info('START DEL USER');

        let now = Date.now();
        const userName = userDeleteInfo.user_name;
        const userSlug = utils.slugify(userDeleteInfo.user_name);
        const userId = userDeleteInfo.user_id;
        const userEmail = userDeleteInfo.user_email ? userDeleteInfo.user_email : '';
        const userFullName = userDeleteInfo.user_fullname ? userDeleteInfo.user_fullname : '';

        winston.info('delete user name =======', userName);
        winston.info('delete user id =======', userId);
        winston.info('delete user email =======', userEmail);
        winston.info('delete user slug =======', userSlug);
        winston.info('delete user fullname =======', userFullName);

        /*Find and delete user documents*/
        async.parallel([
            // Delete _key: users:online, value: [uid]
            function(next) {
                db.sortedSetRemove('users:online', userId.toString(), next)
            },
            // Delete _key: users:joindate, value: [uid]
            function(next) {
                db.sortedSetRemove('users:joindate', userId.toString(), next)
            },
            // Delete user in search by username => Good Work corfirmed
            function(next){
                db.removeObjectSearch(userName.toString(), userId, next);
            },
            // Delete user in search by fullname
            function(next){
                db.removeObjectSearch(userFullName.toString(), userId, next);
            },
            // Delete document for register => Good Work confirmed
            function(next){
                db.sortedSetRemove('username:uid', userName, next);
            },
            // // Delete document for login => Good Work confirmed
            function(next){
                db.sortedSetRemove('userslug:uid', userSlug, function(err){
                    if(err){
                        winston.info('error delete userslug:uid =', userSlug);
                        next(err);
                    }else{
                        winston.info('success delete userslug:uid =', userSlug);
                        next();
                    }
                });
            },
            // // Delete document handle email and user id
            function(next){
                db.sortedSetRemove('email:uid', userEmail, next);
            },
            // Delete facebook account
            function(next){
                
                db.deleteObjByScore('fbid:uid', userId, next);
            },
            // // Delete elements document for loading at home page => Good Work confirmed
            function(next){
                
                var _key = helpers.buildKey('user',userId,'elements');
                db.getSortedSetRangeByScore(_key, 0, -1, 0, now, function(err, elementIds){
                    if(err){
                        next(err);
                    }else{
                        if(elementIds.length == 0){
                            next();
                        }else{
                            db.sortedSetRemove('elements:created-date', elementIds, next);
                        }
                    }               
                })
            },
            // // Delete elements in other user canvas => Good Work confirmed
            function(next){
                
                var _keyOwnElement = helpers.buildKey('user', userId, 'own-elements');
                db.getSortedSetRangeByScore(_keyOwnElement, 0, -1, 0, now, function(err, elementIdsOwnByDelUser){
                    if(err){
                        next(err);
                    }else{
                        if(elementIdsOwnByDelUser.length === 0){
                            next();
                        }else{
                            var _keys = helpers.buildKeys('element', elementIdsOwnByDelUser);
                            db.deleteAll(_keys, next);
                        }
                    }  
                })
            },
            // // Delete elements liked and comments by user
            function(next){
                
                async.parallel([
                    /*DELETE LIKE*/  // Work done
                    function(next_parallel){
                        var _key = helpers.buildKey('user', userId, 'like-elements');

                        db.getSortedSetRange(_key, 0, -1, function(err, listElements){
                            console.log('getSortedSetRange listElements: ', listElements);
                            if(err){
                                console.log('getSortedSetRange like error', err);
                                next(err);
                            }else{
                                var elementLikeKeys = helpers.buildKeysNoPrefix(listElements, "likes");
                                console.log('elementLikesKeys ', elementLikeKeys);
                                db.sortedSetsRemove(elementLikeKeys, userId, next_parallel);
                            }
                        })
                    },
                    /*DELETE COMMENT*/ // Work done
                    function(next_parallel){
                        var _key = helpers.buildKey('user', userId, 'comments');

                        db.getSortedSetRange(_key, 0, -1, function(err, commentIds){
                            if(err){
                                console.log('getSortedSetRange comment error', err);
                                next(err);
                            }else{
                                console.log('getSortedSetRange list', commentIds);
                                async.parallel([
                                    function(next_parallel_step){
                                        var commentKeys = helpers.buildKeys('comment', commentIds);

                                        db.deleteAll(commentKeys, next_parallel_step);
                                    },
                                    function(next_parallel_step){
                                        var commentUserIdKeys = helpers.buildKeys('comment', commentIds, 'userid');

                                        db.deleteAll(commentUserIdKeys, next_parallel_step);
                                    },
                                    function(next_parallel_step){
                                        var commentElementIdKeys = helpers.buildKeys('comment', commentIds, 'elementid');
                                       
                                        db.getMultipleSortedSetRangeByScore(commentElementIdKeys, 0, -1, 0, Date.now(), function(err, elementIds){
                                            async.parallel([
                                                /*REMOVE LIST COMMENT BY ELEMENTID*/
                                                function(next_parallel_step1){
                                                    db.deleteAll(commentElementIdKeys, next_parallel_step1);
                                                },
                                                /*REMOVE LIST USER COMMENTED IN ELEMENTS*/
                                                function(next_parallel_step1){
                                                    var _commentByElementKeys = helpers.buildKeysNoPrefix(elementIds, 'comments');
                                                    db.sortedSetsRemoveMulti(_commentByElementKeys, commentIds, next_parallel_step1);
                                                },
                                                /*REMOVE TEMP DOCS USER COMMENTS*/
                                                function(next_parallel_step1){
                                                    db.delete(_key, next_parallel_step1);
                                                }
                                            ], function(err){
                                                if(err){
                                                    next_parallel_step(err);
                                                }else{
                                                    next_parallel_step();
                                                }
                                            })
                                        })
                                    }
                                ], function(err){
                                    if(err){
                                        next_parallel(err);
                                    }else{
                                        next_parallel();
                                    }
                                })
                            }
                        })
                    }
                ], function(err){
                    if(err){
                        next(err);
                    }else{
                        next();
                    }
                })
            },
            // // Delete follow - Work done
            function(next){
                var _keyFollower = helpers.buildKey('user', userId, 'followers');
                var _keyFollowing = helpers.buildKey('user', userId, 'followings');

                async.waterfall([
                    function(next_child){
                        db.getSortedSetRangeByScore(_keyFollower, 0, -1, 0, now, function(err, followerIds){
                            if(err){
                                return next_child(err);
                            }else{
                                if(followerIds.length === 0){
                                    db.delete(_keyFollower, function(err){
                                        if(err){
                                            return next_child(err);
                                        }else{
                                            next_child();
                                        }
                                    });
                                }else{
                                    async.parallel([
                                        //  Delete del user follower documents
                                        function(next_stepChild){
                                            db.delete(_keyFollower, function(err) {
                                                if(err){
                                                    return next_stepChild(err);
                                                }else{
                                                    next_stepChild();
                                                }
                                            });
                                        },
                                        //  Delete documents following users
                                        function(next_stepChild){
                                            var _keysFollowing = helpers.buildKeys('user', followerIds, 'followings');
                                            
                                            db.sortedSetsRemoveNoValuePattern(_keysFollowing, userId, function(err){
                                                if(err){
                                                    return next_stepChild(err);
                                                }else{
                                                    next_stepChild();
                                                }
                                            });
                                        }

                                    ], function(err){
                                        if(err){
                                            next_child(err);
                                        }else{
                                            next_child(); 
                                        }
                                        
                                    })
                                }
                            }
                        })
                    },
                    function(next_child){
                        db.getSortedSetRangeByScore(_keyFollowing, 0, -1, 0, now, function(err, followingIds){
                            if(err){
                                return next_child(err);
                            }else{
                                if(followingIds.length === 0){
                                    db.delete(_keyFollowing, function(err){
                                        if(err){
                                            console.log('Delete followingIds length = 0 error: ', err);
                                            return next_child(err);
                                        }else{
                                            next_child();
                                        }
                                    });
                                }else{
                                    async.parallel([
                                        //  Delete del user follower documents
                                        function(next_stepChild){
                                            db.delete(_keyFollowing, function(err){
                                                if(err){
                                                    console.log('Delete _keyFollowing error', err);
                                                    return next_stepChild(err);
                                                }else{
                                                    next_stepChild();
                                                }
                                            });
                                        },
                                        //  Delete documents following users
                                        function(next_stepChild){
                                            var _keysFollower = helpers.buildKeys('user', followingIds, 'followers');

                                            db.sortedSetsRemoveNoValuePattern(_keysFollower, userId, function(err){
                                                if(err){
                                                    console.log('Delete _keysFollower error: ', err);
                                                    return next_stepChild(err);
                                                }else{
                                                    next_stepChild();
                                                }
                                            });
                                        }

                                    ], function(err){
                                        if(err){
                                            next_child(err);
                                        }else{
                                            next_child();
                                        }
                                    })
                                }
                            }
                        })
                    }

                ], function(err){
                    if(err){
                        next(err);
                    }else{
                        next();
                    }
                })
            },

            // Delete _key: uid:[uid]:ip
            function(next) {
                db.sortedSetRemove(`uid:${userId}:ip`, '::1', next)
            },
            // Delete _key: ip:[ip]:uid
            function(next) {
                db.sortedSetRemove('ip:::1:uid', userId, next)
            }

        ], function(err){
            if(err){
                winston.info(' END DEL USER');
                callback(err);
            }else{
                winston.info('Success delete user');
                winston.info('END DEL USER');
                callback(null);
            }
        })
    }   
};