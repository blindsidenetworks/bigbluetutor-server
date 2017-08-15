# express-async

Like [async] except for [express].

![build status](http://img.shields.io/travis/izaakschroeder/express-async.svg?style=flat&branch=master)
![coverage](http://img.shields.io/coveralls/izaakschroeder/express-async.svg?style=flat&branch=master)
![license](http://img.shields.io/npm/l/express-async.svg?style=flat)
![version](http://img.shields.io/npm/v/express-async.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/express-async.svg?style=flat)

## Methods

### parallel

```javascript
var async = require('express-async');

function mw1(req, res, next) {

}

function mw2(req, res, next) {

}

app.get('/', async.parallel(mw1, mw2));
```

### serial

```javascript
var async = require('express-async');

function mw1(req, res, next) {

}

function mw2(req, res, next) {

}

app.get('/', async.serial(mw1, mw2));
```

[express]: http://expressjs.com/
[async]: https://github.com/caolan/async
