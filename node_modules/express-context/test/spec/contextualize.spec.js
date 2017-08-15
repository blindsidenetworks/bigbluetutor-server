
'use strict';

var contextualize = require('contextualize'),
	express = require('express'),
	request = require('supertest');

function middleware() {
	return sinon.spy(function(req, res, next) {
		next();
	});
}

describe('contextualize', function() {

	beforeEach(function() {
		this.app = express();
	});

	it('should construct with single property', function() {
		contextualize('foo');
	});

	it('should construct with array of properties', function() {
		contextualize([ 'foo', 'bar' ]);
	});

	it('should construct with explicit configuration object', function() {
		contextualize({ properties: ['foo', 'bar' ] });
	});

	it('should fail when neither object nor string is given', function() {
		expect(function() {
			contextualize(5);
		}).to.throw(TypeError);
	});

	it('should fail on when properties is not an array', function() {
		expect(function() {
			contextualize({ properties: true });
		}).to.throw(TypeError);
	});

	it('should fail on when properties does not contain strings', function() {
		expect(function() {
			contextualize({ properties: [ 'yes', true ] });
		}).to.throw(TypeError);
	});

	it('should automatically setup the context', function(done) {

		function x(req, res, next) {
			req.magic = 'lol';
			next();
		}

		var context = contextualize('magic');
		this.app.use(context.for('x').use(x));
		this.app.get('/', function(req, res) {
			res.status(200).send(context.of(req));
		});

		request(this.app).get('/').expect(function(res) {
			expect(res.statusCode).to.equal(200);
			expect(res.body).to.deep.equal({
				x: {
					magic: 'lol'
				}
			});
		}).end(done);
	});

	it('should return contextualized values within middleware', function(done) {
		var context = contextualize('foo');
		this.app.use(context);

		this.app.use(context.for('test').use(function a(req, res, next) {
			req.foo = 'bananas';
			expect(req.foo).to.equal('bananas');
			next();
		}));

		this.app.get('/', function(req, res) {
			res.status(200).send();
		});

		request(this.app).get('/').end(done);
	});

	it('should produce correct contextualized values after', function(done) {

		function a(req, res, next) {
			req.foo = 'bananas';
			next();
		}

		function b(req, res, next) {
			req.foo = 'apples';
			next();
		}

		var context = contextualize({
			properties: [ 'foo' ],
			context: 'bananas'
		});

		this.app.use(context.for('a').use(a));
		this.app.use(context.for('b').use(b));

		this.app.get('/', function(req, res) {
			res.status(200).send(context.of(req));
		});

		request(this.app).get('/').expect(function(res) {
			expect(res.body).to.deep.equal({
				a: { foo: 'bananas' },
				b: { foo: 'apples' }
			});
		}).end(done);
	});

	describe('#of', function() {
		it('should fail on non-contextualized objects', function() {
			var context = contextualize('foo');
			expect(function() {
				context.of(function() {

				});
			}).to.throw(TypeError);
		});

		it('should return context object when context is array', function() {
			var context = contextualize('foo');
			var val = { context: { a: { foo: 1 }, b: { foo: 2 } } };
			var res = context.of.call({ context: ['a', 'b'] }, val, true);
			expect(res).to.have.deep.property('a.foo', 1);
			expect(res).to.have.deep.property('b.foo', 2);
		});

		it('should return context object when requested', function() {
			var context = contextualize('foo');
			var val = { context: { a: { foo: 1 } } };
			expect(context.of.call({ context: 'a' }, val, true))
				.to.have.deep.property('a.foo', 1);
		});

		it('should return context value when context is string', function() {
			var context = contextualize('foo');
			var val = { context: { a: { foo: 1 } } };
			expect(context.of.call({ context: 'a' }, val))
				.to.have.property('foo', 1);
		});
	});

	describe('#mixin', function() {
		it('should add desired properties', function() {
			var context = contextualize('foo');
			var res = context.mixin({
				bar: 5
			});
			expect(res).to.have.property('bar', 5);
			expect(context).not.to.have.property('bar');
		});

		it('should invoke the original function', function() {
			var context = contextualize('foo'), stub = sinon.stub();
			var res = context.mixin.call(stub, {
				bar: 5
			});
			var req = { id: 1 };

			res(req);
			expect(stub).to.be.calledWith(req);
		});
	});

	describe('#use', function() {
		it('should return a function with all current properties', function() {
			var context = contextualize('foo');
			context.foo = 5;
			expect(context.use(middleware())).to.have.property('foo', 5);
		});

		it('should return a function with all new properties', function() {
			var foo = middleware();
			foo.foo = 1;
			var context = contextualize('foo');
			expect(context.use(foo)).to.have.property('foo', 1);
		});

		it('should call both functions in order', function() {
			var context = contextualize('foo'),
				s1 = middleware(),
				s2 = middleware(),
				s3 = sinon.stub();
			context.use(s1).use(s2)({ }, { }, s3);
			expect(s3).to.be.calledAfter(s2);
			expect(s2).to.be.calledAfter(s1);
			expect(s1).to.be.calledOnce;
		});

		it('should fail when argument is not a function', function() {
			var context = contextualize('foo');
			expect(function() {
				context.use({ foo: 5 });
			}).to.throw(TypeError);
		});
	});

	describe('#for', function() {

		it('should generate no context on arrays', function() {
			var context = contextualize('foo');
			expect(context.for(['a', 'b']).context)
				.to.deep.equal(['a', 'b']);
		});

		it('it should fail on functions', function() {
			var context = contextualize('color');
			expect(function() {
				context.for(function() { });
			}).to.throw(TypeError);
		});

		it('should inject local values to context chain', function(done) {

			function test(req, res, next) {
				req.color = 'yellow';
				next();
			}

			var context = contextualize('color');

			this.app.use(context.for('myfoo').use(test));
			this.app.use(function(req, res, next) {
				var data = context.of(req);
				expect(data).to.have.property('myfoo');
				expect(data.myfoo).to.have.property('color', 'yellow');
				next();
			});
			this.app.get('/', function(req, res) {
				res.status(200).send();
			});

			request(this.app).get('/').expect(function(res) {
				expect(res.statusCode).to.equal(200);
			}).end(done);
		});

		it('should work with arrays', function(done) {
			function a(req, res, next) {
				req.foo = 'bar';
				next();
			}
			function b(req, res, next) {
				req.foo = 'baz';
				next();
			}

			var context = contextualize('foo'),
				ab = context.for('a', 'b').use(a, b);

			expect(ab).to.not.be.null;

			this.app.use(context);
			this.app.use(ab);
			this.app.use(function(req, res, next) {
				var data = ab.of(req);
				expect(data).to.have.property('a');
				expect(data).to.have.property('b');
				expect(data.a).to.have.property('foo', 'baz');
				expect(data.b).to.have.property('foo', 'baz');
				next();
			});

			request(this.app).get('/').end(done);
		});
	});
});
