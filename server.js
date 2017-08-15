const express = require('express');
const auth = require('express-authentication');
const app = express();

var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem')
}

var users = {};
var inactiveUsers = [];

app.use(function authenticate(req, res, next) {
  if (req.auth && users[req.auth.username]) {
    if (users[req.auth.username].password == req.auth.password) {
      next();
    }else {
      return res.status(401).send({error: 'authentication failed'});
    }
  }else {
    return res.status(401).send({error: 'authentication failed'});
  }
});

app.post('/api/register', function(req, res) {
  if (req.params.username && req.params.auth.password) {
    if (users[req.params.auth.username]) {
      res.status(409).send('USERNAME HAVE ALREADY BEEN TAKEN');
    }else {
      users[req.params.auth.username] = {
        password: req.params.auth.password,
        friends: [],
        active: true,
      };
      res.send('USER REGISTERED');
    }
  }else {
    res.status(400).send("Missing username and/or password");
  }
});

app.post('/api/login', auth.required(), function(req, res) { 
  res.send("SUCCESS");
});

app.get('/api/friends', auth.required(), function(req, res) {
  var user = users[req.params.auth.username]
  var activeFriends = [];
  for (friend in user.friends) {
    if(friend.active) {
      activeFriends.push(friend);
    }
  }
});

app.get('/api/ping', auth.required(), function(req, res) {
  
});

app.get('/', function(req, res) {
 res.send({text: 'hi'});
});


var server = https.createServer(options, app)

server.listen(3000);

