
'use strict';

var util = require('../../lib/util');

function fn1(a, b, c) {
	return c;
}

function fn2(a, b, c) {
	return c;
}

function fn3(a) {
	return a;
}

describe('util', function() {
	describe('.isMiddleware', function() {
		it('should be false if function has less than 3 arguments', function() {
			expect(util.isMiddleware(fn3)).to.be.false;
		});

		it('should be true if function has exactly 3 arguments', function() {
			expect(util.isMiddleware(fn1)).to.be.true;
		});
	});

	describe('.isMiddlewareList', function() {
		it('should be false if not an array', function() {
			expect(util.isMiddlewareList(true)).to.be.false;
		});

		it('should be true if valid array', function() {
			expect(util.isMiddlewareList([fn1, fn2])).to.be.true;
		});

		it('should be false if invalid array', function() {
			expect(util.isMiddlewareList([fn1, fn3])).to.be.false;
		});
	});

	describe('.checkMiddlewareList', function() {
		it('should throw an exception', function() {
			expect(function() {
				util.checkMiddlewareList([fn1, fn3]);
			}).to.throw(TypeError);
		});
		it('should do nothing', function() {
			util.checkMiddlewareList([fn1, fn2]);
		});
	});

	describe('.normalizeMiddlewareList', function() {
		it('should mash arguments to single array', function() {
			function check() {
				return util.normalizeMiddlewareList(arguments);
			}

			expect(check(fn1, [fn2, fn3])).to.deep.equal([fn1, fn2, fn3]);
		});
	});
});
