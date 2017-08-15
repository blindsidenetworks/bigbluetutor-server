
'use strict';

var parallel = require('parallel'),
	_ = require('lodash');

describe('parallel', function() {

	it('should fail if an array is not given', function() {
		expect(function() {
			parallel(true);
		}).to.throw(TypeError);
	});

	it('should call all middlewares', function() {
		var spy = sinon.spy(function (a, b, c) {
			c(null);
		});
		var spy2 = sinon.spy(function (d, e, f) {
			f(null);
		});
		var middleware = parallel([spy2, spy]);
		middleware({ }, { }, _.noop);
		expect(spy).to.be.calledOnce;
		expect(spy2).to.be.calledOnce;
	});

	it('should error', function() {
		var spy = sinon.spy(function (a, b, c) {
			c('fake-error');
		});
		var spy2 = sinon.spy(function (d, e, f) {
			f(null);
		});
		var middleware = parallel([spy]);
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
		var middleware = parallel([mdlware1, mdlware2, mdlware3]);
		middleware({ }, { }, spy);
		expect(spy).to.be.calledWith('fake-error');
	});

	it('should call all middleware in parallel', function() {
		var mdlware1 = sinon.spy(function (a, b, c) {
			setTimeout(c, 10);
		});
		var mdlware2 = sinon.spy(function (d, e, f) {
			setTimeout(f, 10);
		});
		var mdlware3 = sinon.spy(function (g, h, i) {
			setTimeout(i, 10);
		});
		var middleware = parallel([mdlware1, mdlware2, mdlware3]);
		middleware({ }, { }, _.noop);
		expect(mdlware1).to.be.calledOnce;
		expect(mdlware2).to.be.calledOnce;
		expect(mdlware3).to.be.calledOnce;
	});

});
