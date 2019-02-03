'use strict'

var path = require('path'),
	fs = require('fs'),
	nconf = require('nconf'),
	morgan = require('morgan'),
	express = require('express'),
	async = require('async'),
	middleware = require('./middleware'),
	compression = require('compression'),
	winston = require('winston'),
	routes = require('./routes'),
	rfs = require('rotating-file-stream'),
	app = express(),
	server;
	require('winston-daily-rotate-file');

// Setup logger
/*app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'));
app.use(compression());*/

if (nconf.get('ssl')) {
	console.log("Running with SSL/TSL configure")
	server = require('https').createServer({
		key: fs.readFileSync(nconf.get('ssl').key),
		cert: fs.readFileSync(nconf.get('ssl').cert),
		ca: fs.readFileSync(nconf.get('ssl').ca)
	}, app);
} else{
	console.log("Running without SSL/TSL configure")
	server = require('http').createServer(app);
};

module.exports.server = server;


//If getting the same port available then exit starting
server.on('error', function (err) {
	if (err.code === 'EADDRINUSE'){
		winston.error('Traceroll address in use, exiting....');
		process.exit(0);
	} else{
		throw err;
	}
});

var io = require('socket.io')(server);
io.on('connection', (socket) => {
		console.log("listening done");
    require('./socketio')(io, socket);
});
io.set("transports", ["xhr-polling","websocket","polling"]);

server.setTimeout(60000);

module.exports.listen = function () {
	middleware = middleware(app);
	log_configuration();
	listen();
	routes(app, middleware);
}

function listen(){
	var port = nconf.get('port');
	var args = [port];

	if (port !== 80 && port !== 443 && nconf.get('use_port') === false) {
		winston.info('Enabling trust proxy');
		app.enable('trust proxy');
	};

	args.push(function(err) {
		if (err) {
			winston.info('[startup] Server was unable to listen on: ' + port);
			process.exit();
		}
        let env = global.env;
        if (env) {
            env = env.trim();

            console.log('NODE_ENV =', env)
            winston.dct_logger.info('NODE_ENV =', env)
        } else {
            console.log('You have to set NODE_ENV')
            console.log('linux & mac: export NODE_ENV=development/production')
            console.log('windows: set NODE_ENV=development/production')
            winston.dct_logger.error('You have to set NODE_ENV')
            winston.dct_logger.error('linux & mac: export NODE_ENV=development/production')
            winston.dct_logger.error('windows: set NODE_ENV=development/production')
            process.exit();
        }

		winston.info('Server is now listening on: ' + port);


	});
	console.log("listening");
	server.listen.apply(server, args);
}


function log_configuration(){
	// Setup logger
	var logDirectory = path.join(__dirname, 'log');
	var logFileName = path.join(logDirectory, '/log');
	// ensure log directory exists
	fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

	// create a rotating write stream
	var accessLogStream = rfs('access.log', {
	  interval: '1d', // rotate daily
	  path: logDirectory
	});

	app.use(morgan(':remote-addr - :remote-user [:date[web]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',{stream: accessLogStream}));
	app.use(compression());



	var transport = new (winston.transports.DailyRotateFile)({
	    filename: logFileName,
	    datePattern: 'yyyy-MM-dd.',
	    prepend: true,
	    //level: process.env.ENV == 'development' ? 'debug' : 'info'
	    level: nconf.get('log_level') === 'info' ? 'info' : 'debug'
	  });
	var logger = new (winston.Logger)({
	    transports: [
	      transport
	    ]
	  });
	winston.dct_logger = logger;



}
