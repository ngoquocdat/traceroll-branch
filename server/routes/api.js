"use strict";

var express = require('express'),
	helpers = require('./helpers'),
	FacebookStrategy = require('passport-facebook').Strategy,
	passport = require('passport'),
	user = require('../models/users'),
	db = require('../database/mongo'),
	nconf = require('nconf');

const async = require('async')
let tempProfilePicURL = ''
let tempName = ''
passport.use(new FacebookStrategy({
	clientID: (nconf.get('fbApp')).clientID,
	clientSecret: (nconf.get('fbApp')).clientSecret,
	callbackURL: nconf.get('url')+nconf.get('fbCallbackURL'),
	profileFields: ['id', 'email', 'name', 'displayName', 'gender','picture.type(large)']
},(accessToken, refreshToken, profile, done) => {
	console.log('======== callbackURL: ', nconf.get('url')+nconf.get('fbCallbackURL'))
	console.log(profile)
	user.getUidByFBID(profile.id,(err,uid)=>{
		if (err) {
			done('[[error:server-error]]');
		}
		else {
			if (!uid) {
				let userData = {
					username:profile.displayName.replace(/ +/g, "").toLowerCase(),
					userslug:profile.username || `fb-${profile.id}`,
					email:profile.email || "",
					fullname:profile.displayName || "",
					picture: profile.photos[0].value,
					birthday:"",
					fbID:profile.id,
					isNew:true
				}
				if (profile.emails) {
					userData.email = profile.emails[0].value
				}
				done(null,userData)
			}
			else {
				tempProfilePicURL = profile.photos[0].value
				tempName = profile.displayName
				user.getUserById(uid,(err,userData)=>{
					if (err) {
						done(err)
					}
					else {
						userData.uid = userData.userId
						done(null,userData)
					}
				})
			}
		}
	})
}));

module.exports =  function(app, middleware, controllers) {

	var router = express.Router();
	app.use('/api', router);

	router.get('/config', middleware.applyCSRF, controllers.api.getConfig);
	router.get('/get-workspace/:userslug', middleware.authorized, controllers.api.getWorkspace);  //API route for getting workspace of user
	router.get('/element/list/:userslug', middleware.authorized, controllers.api.getElementsByUser); //API route for getting list of element of user
	router.get('/element/list/:userslug/:pageNum/:pageSize/:currentElementId', middleware.authorized, controllers.api.getElementsByUserPaging); //API route for getting list of element of user by paging
	// router.get('/newsfeed/list/:offset', middleware.authorized, controllers.api.getNewsfeed); //API route for getting newsfeed
	router.post('/newsfeed/list', middleware.authorized, controllers.api.getNewsfeed); //API route for getting newsfeed
	router.get('/frame/:userslug', middleware.authorized, controllers.api.getFrame); //API route for getting frame of user

	router.get('/user/join-date/:userslug', middleware.authorized, controllers.api.getJoinDate); //API route for getting join date of user
	router.get('/profile', middleware.authorized, controllers.api.getProfile) //API route for getting user data

	router.get('/frontend-config/', middleware.authorized, controllers.api.getFrontendConfig); // API route for getting frontend config from server
	
	router.post('/upload', middleware.authorized, controllers.uploadHelper.upload); //API route for uploading image
	router.post('/element/save', middleware.authorized, controllers.api.saveElement); //API route for saving element
	router.post('/element/delete', middleware.authorized, controllers.api.deleteElement); //API route for deleting element
	router.post('/element/text/save', middleware.authorized, controllers.api.saveTextElement); //API route for saving text element
	router.post('/element/image/save', middleware.authorized, controllers.api.saveImageElement); //API route for saving image element
	router.post('/element/drawing/save', middleware.authorized, controllers.api.saveDrawingElement); //API route for saving image element
	router.post('/element/video/save', middleware.authorized, controllers.api.saveVideoElement); //API route for saving video element
	router.post('/element/drawing/update', middleware.authorized, controllers.api.updateDrawingElement); //API route for update drawing element
	router.post('/element/text/update', middleware.authorized, controllers.api.updateTextElement); //API route for updating text element
	router.post('/element/image/update', middleware.authorized, controllers.api.updateImageElement); //API route for updating image element
	router.post('/element/video/create-thumb', middleware.authorized, controllers.uploadHelper.createThumbnailVideo); //API route for create video thumbnail
	router.post('/frame/save', middleware.authorized, controllers.api.saveFrame); //API route for saving frame
	router.post('/frame/delete', middleware.authorized, controllers.api.deleteFrame); //API route for delete frame
	router.post('/search/username', middleware.authorized, controllers.api.searchUserName); //API route for search username
	router.post('/update-profile-image', middleware.authorized, controllers.api.updateProfileImage);
	router.post('/comments/save', middleware.authorized, controllers.api.saveComments); //API save comments
	router.post('/element/like', middleware.authorized, controllers.api.elementLike); // API save like
	router.post('/element/dislike', middleware.authorized, controllers.api.elementDislike); // API save dislike
	router.post('/user/delete', middleware.authorized, controllers.api.deleteUser); // API delete user
	router.post('/user/change-pass', middleware.authorized, controllers.api.changePassword); // APi change user password
	router.post('/user/follow', middleware.authorized, controllers.api.follow); // API check follow user
	router.post('/user/unfollow', middleware.authorized, controllers.api.unfollow); // API un-check follow user
	router.post('/user/follow-detail', middleware.authorized, controllers.api.followDetail); // API show follow detail (count number)
	router.post('/user/notifications/list', middleware.authorized, controllers.api.loadNotifications); // API show list notification
	router.post('/notification/create', middleware.authorized, controllers.api.createNotification); // API create new notification
	router.post('/user/report', middleware.authorized, controllers.api.sendReportMail);// API send user report
	router.post('/user/check-permission', middleware.authorized, controllers.api.checkPermission);// API check user is permission
	router.post('/user/update-permission', middleware.authorized, controllers.api.updatePermission);// API allow or un-allow user permission
	router.post('/follow/check-follower', middleware.authorized, controllers.api.checkFollower);// API check current user is following entering user 
	router.get('/user/non-register/:token', middleware.authorized, controllers.api.deleteUserNonRegist);// API delete user if non-register via email
	router.post('/user/update-profile-position', middleware.authorized, controllers.api.updateProfilePosition); // APi change user password
	router.post('/profile/hide', middleware.authorized,controllers.api.updateHideProfileImage); // APi change user password

	//FACEBOOK Login API
	router.get('/auth/facebook', passport.authenticate('facebook',{
		scope:['email','user_birthday','user_gender']
	}));
	router.get('/fbauthcallback',
		(req,res,next)=>{
			passport.authenticate('facebook', { 
				//successRedirect: 'http://localhost:9000',
				failureRedirect: nconf.get('url')+'/signup' 
			},(err,user,info)=>{
				if (err) {
					console.log(err)
					res.redirect('/login')
				}
				else {
					if (user.isNew) {
						let qs = ""
						delete user.isNew
						Object.keys(user).forEach((key)=>{
							if (qs==="") {
								qs = `?${key}=${user[key]}`
							}
							else {
								qs += `&${key}=${user[key]}`
							}
						})
						res.redirect(`/signupfb${qs}`)
					}
					else {
						console.log(tempProfilePicURL)
						req.logIn(user, function(err) {
							if (err) { return next(err); }
							return res.redirect(`/loginfb?name=${tempName}&profile=${tempProfilePicURL}`)
						});
					}
				}
			})(req, res, next)
		}
	);
};

