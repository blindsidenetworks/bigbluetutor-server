
'use strict';

var async = require('async');

describe('async', function() {
	it('should export parallel', function() {
		expect(async.parallel).to.be.an.instanceof(Function);
	});
});
