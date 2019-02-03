'use strict';

var staticController = {};

createStatic('404');
createStatic('403');
createStatic('500');

function createStatic(statusCode) {
	staticController[statusCode] = function (request, response) {
		console.log(statusCode);
		if (!response.locals.isAPI){

			response.statusCode = parseInt(statusCode, 10);
		}
		response.render(statusCode, {errorMessage: request.flash('errorMessage')[0] || undefined});
	}
}

module.exports = staticController;