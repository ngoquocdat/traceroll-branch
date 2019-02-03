"use strict";

var nconf = require('nconf'),
	express = require('express'),
	path = require('path'),
	winston = require('winston'),
	controllers = require('../controllers'),
	authRoutes = require('./authentication'),
	apiRoutes = require('./api'),
	helpers = require('./helpers');

var setupPageRoute = helpers.setupPageRoute;
var setupPageRouteSimple = helpers.setupPageRouteSimple;
var setupPageRouteMiddleware = helpers.setupPageRouteMiddleware;
var setupPageRoutePost = helpers.setupPageRoutePost;

function frontendRoutes(app, middleware, controllers) {
	setupPageRoute(app, "*", middleware, [], function (req, res, next) {
		res.sendFile(path.resolve(__dirname, '../..', 'build', 'index.html'));
	});

}

//All routes are configured for backend pages
function backendRoutes(app, middleware, controllers){
	setupPageRoute(app, "/admin", middleware, [middleware.redirectToLoginIfGuest], controllers.index);
	
}



function staticRoutes(app, middleware, controllers) {
	setupPageRoute(app, '/404', middleware, [], controllers.static['404']);
	setupPageRoute(app, '/403', middleware, [], controllers.static['403']);
	setupPageRoute(app, '/500', middleware, [], controllers.static['500']);
}


module.exports = function (app, middleware) {
	var router = express.Router(),
		authRouter = express.Router(),
		relativePath = nconf.get('relative_path');

	authRouter.hotswapId = 'auth';

	apiRoutes(app, middleware, controllers);
	staticRoutes(app, middleware, controllers);

	frontendRoutes(app, middleware, controllers);

	

	app.use(relativePath, authRouter);
	handle404(app, middleware);
	//handleErrors(app, middleware);
	authRoutes.reloadRoutes();

}

function handle404(app, middleware) {
	app.use(function(req, res, next) {

		var relativePath = nconf.get('relative_path');
		var	isLanguage = new RegExp('^' + relativePath + '/language/[\\w]{2,}/.*.json'),
			isClientScript = new RegExp('^' + relativePath + '\\/src\\/.+\\.js');

		if (isClientScript.test(req.url)) {
			res.type('text/javascript').status(200).send('');
		} else if (isLanguage.test(req.url)) {
			res.status(200).json({});
		} else if (req.accepts('html')) {
			if (process.env.NODE_ENV === 'development') {
				winston.warn('Route requested but not found: ' + req.url);
			}

			res.status(404);

			if (res.locals.isAPI) {
				return res.json({path: req.path, error: 'not-found'});
			}

			middleware.buildHeader(req, res, function() {
				res.render('shared/error/404', {path: req.path});
			});
		} else {
			res.status(404).type('txt').send('Not found');
		}
	});
}

//Handling all errors from client request
function handleErrors(app, middleware) {

	app.use(function (err, request, response, next) {
		if (err.code ==='EBADCSRFTOKEN'){
			winston.error(request.path + '\n', err.stack)
			return response.sendStatus(403);
		}

		winston.error(request.path + '\n', err.stack);
		response.status(err.status || 500);
		if (response.locals.isAPI){
			return response.json({path: request.path, error: err.message});
		} else {
			middleware.buildHeader(request, response, function () {
				response.render('500', {path: request.path, error: err.message});
			})
		}
	});
}