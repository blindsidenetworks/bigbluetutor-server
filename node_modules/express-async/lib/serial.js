
'use strict';

var util = require('./util');

function serial(middlewares) {

	middlewares = util.normalizeMiddlewareList(arguments);
	util.checkMiddlewareList(middlewares);

	if (middlewares.length === 1) {
		return middlewares[0];
	}

	return function dispatch(req, res, next) {
		function handle(i) {
			if (i >= middlewares.length) {
				next();
			} else {
				middlewares[i](req, res, function done(err) {
					if (err) {
						next(err);
					} else {
						handle(i + 1);
					}
				});
			}
		}
		handle(0);
	};
}

module.exports = serial;
