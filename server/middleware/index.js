'use strict';

var path = require('path'),
	fs = require('fs'),
	winston = require('winston'),
	express = require('express'),
	flash = require('connect-flash'),
	bodyParser = require('body-parser'),
	db = require('../database/mongo'),
	cookieParser = require('cookie-parser'),
	methodOverride = require('method-override'),
	nconf = require('nconf'),
	auth = require('../routes/authentication'),
	compression = require('compression'),
	hotswap = require('./../controllers/hotswap'),
	session = require('express-session');

var middleware = {};

module.exports = function (app) {
	middleware = require('./middleware')(app);
	app.set(flash());
	
	app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));(app);
	app.use(bodyParser.json({limit: '50mb'}));
	app.use(methodOverride());
	app.use(cookieParser());
	app.set("view options", {layout: false});
	app.use(compression());
	app.use(express.static(path.resolve(__dirname, '../..', 'build'),{
		maxAge: app.enabled('cached')? 5184000000 : 0
	}));

	var cookie = {
		maxAge: 1000 * 60 * 60 * 24 * parseInt(14, 10)
	};

	app.use(function(req, res, next) { //allow cross origin requests
        res.header("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header('Access-Control-Allow-Credentials', true);
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        if ('OPTIONS' == req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    });

	app.use(session({
		store: db.sessionStore,
		secret: nconf.get('secret'),
		key: 'express.sid',
		cookie: cookie,
		resave: true,
		saveUninitialized: true
	}));

	app.use(function (request, response, next) {
		response.setHeader('X-Powered-By', 'DCT');
		next();
	});
	//Override Express logger
	hotswap.prepare(app);
	auth.initialize(app, middleware);

	return middleware;

}