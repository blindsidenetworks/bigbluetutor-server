
'use strict';

var path = require('path'),
	express = require('express'),
	contextualize = require(path.join(__dirname, '..'));

var app = express();


function middleware1(req, res, next) {
	req.foo = 5;
	req.bar = 10;
	next();
}

function middleware2(req, res, next) {
	req.foo = 7;
	req.bar = 1;
	next();
}

var context = contextualize(['foo', 'bar']);

app.use(context.for('a').use(middleware1));
app.use(context.for('b').use(middleware2));

app.use(function result(req, res) {
	console.log(context.of(req));
	res.status(200).send({
		first: context.for('a').of(req),
		second: context.for('b').of(req)
	});
});

app.listen(5553);
