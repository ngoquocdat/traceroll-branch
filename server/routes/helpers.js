'use strict';

var helpers = {};



helpers.setupPageRoute = function(router, name, middleware, middlewares, controller) {
	
	middlewares = middlewares.concat([middleware.pageView]);
	router.get(name, middleware.buildHeader, middlewares, controller);
	//router.get('/api' + name, middlewares, controller);
};


helpers.setupApiRoute = function(router, name, middlewares, controller) {
	
	router.get('/api' + name, middlewares, controller);
};

helpers.setupPageRoutePost = function(router, name, middlewares, controller) {
	//middlewares = middlewares.concat([middleware.pageView]);
	//router.post(name, middleware.buildHeader, middlewares, controller);
	router.post(name, middlewares, controller);
	
};
helpers.setupPageRouteMiddleware = function (router, name, middleware, controller) {
	router.get(name, middleware.buildHeader, controller);
};

helpers.setupPageRouteSimple = function (router, name, middlewares, controller) {
	router.get(name, middlewares, controller);
}


module.exports = helpers;