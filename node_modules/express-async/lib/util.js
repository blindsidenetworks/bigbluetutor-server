
'use strict';

var _ = require('lodash');

function isMiddleware(fn) {
	return _.isFunction(fn) && fn.length === 3;
}

function isMiddlewareList(list) {
	return _.isArray(list) && _.every(list, isMiddleware);
}

function checkMiddlewareList(list) {
	if (!isMiddlewareList(list)) {
		throw new TypeError('Invalid middleware list.');
	}
}

function normalizeMiddlewareList(list) {
	return _.flatten(list);
}

module.exports = {
	isMiddleware: isMiddleware,
	isMiddlewareList: isMiddlewareList,
	checkMiddlewareList: checkMiddlewareList,
	normalizeMiddlewareList: normalizeMiddlewareList
};
