
'use strict';

var util = require('./util');

function parallel(middlewares) {

	middlewares = util.normalizeMiddlewareList(arguments);
	util.checkMiddlewareList(middlewares);

	if (middlewares.length === 1) {
		return middlewares[0];
	}

	return function run(req, res, next) {
		// Count how many middlewares there are.
		var remaining = middlewares.length, done = false;
		// Called after each middleware has run.
		function ran(err) {
			if (!done && (err || --remaining <= 0)) {
				done = true;
				next(err);
			}
		}
		// Loop through all the middlewares and call them.
		for (var i = 0; i < middlewares.length; ++i) {
			middlewares[i](req, res, ran);
		}
	};
}

module.exports = parallel;
