
'use strict';

var serial = require('serial'),
	_ = require('lodash');

describe('serial', function() {
	it('should fail if an array is not given', function() {
		expect(function() {
			serial(true);
		}).to.throw(TypeError);
	});

	it('should call the middleware', function() {
		var spy = sinon.spy(function (a, b, c) {
			c(null);
		});
		var middleware = serial([spy]);
		middleware({ }, { }, _.noop);
		expect(spy).to.be.calledOnce;
	});

	it('should call all middlewares in order', function(done) {
		var mdlware1 = sinon.spy(function (a, b, c) {
			setTimeout(c, 10);
		});
		var mdlware2 = sinon.spy(function (d, e, f) {
			setTimeout(f, 10);
		});
		var mdlware3 = sinon.spy(function (g, h, i) {
			setTimeout(i, 10);
		});
		var middlware = serial([mdlware1, mdlware2, mdlware3]);
		middlware({ }, { }, function() {
			expect(mdlware3).to.be.calledAfter(mdlware2);
			expect(mdlware2).to.be.calledAfter(mdlware1);
			expect(mdlware1).to.be.calledOnce;
			done();
		});
	});

	it('should error', function() {
		var spy = sinon.spy(function (a, b, c) {
			c('fake-error');
		});
		var spy2 = sinon.spy(function (d, e, f) {
			f(null);
		});
		var middleware = serial([spy, spy2]);
		middleware({ }, { }, _.noop);
		expect(spy2).to.not.be.called;
	});

	it('should bubble up errors', function() {
		var spy = sinon.spy();
		var mdlware1 = sinon.spy(function (a, b, c) {
			c(null);
		});
		var mdlware2 = sinon.spy(function (d, e, f) {
			f('fake-error');
		});
		var mdlware3 = sinon.spy(function (g, h, i) {
			i(null);
		});
		var middleware = serial([mdlware1, mdlware2, mdlware3]);
		middleware({ }, { }, spy);
		expect(spy).to.be.calledWith('fake-error');
	});
});
