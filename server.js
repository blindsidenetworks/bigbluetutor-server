const express = require('express');
const auth = require('express-authentication');
const app = express();
const bodyParser = require('body-parser');
const WebSocket = require('ws');

var https = require('https');
var fs = require('fs');
var User = require('./user.js');
var createMeeting = require('./meeting.js');

var options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem')
}

var users = {};
var inactiveUsers = [];

app.use(bodyParser.json());

app.post('/api/register', function(req, res) {
  if (req.body && req.body.auth && req.body.auth.username && req.body.auth.password) {
    if (users[req.body.auth.username]) {
      res.status(409).send('USERNAME HAVE ALREADY BEEN TAKEN');
    }else {
      var user = User(req.body.auth.username, req.body.auth.password);
      users[req.body.auth.username] = User(req.body.auth.username, req.body.auth.password);
      res.send('USER REGISTERED');
    }
  }else {
    res.status(400).send("Missing username and/or password");
  }
});

app.use(function authenticate(req, res, next) {
  console.log("AUTHENTICATE!");
  if (req.body && req.body.auth && users[req.body.auth.username] && users[req.body.auth.username].password == req.body.auth.password) {
    next();
  }else {
    return res.status(401).send({error: 'authentication failed'});
  }
});


app.post('/api/login', auth.required(), function(req, res) { 
  res.send("SUCCESS");
});


var server = https.createServer(options, app)

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  var authenticated = false;
  var user = null;
  console.log("socket connected");
  ws.on('message', function incoming(data) {
    var req = JSON.parse(data);
    if (!authenticated) {
      if( users[req.username] && users[req.username].password == req.password) {
        authenticated = true;
        user = users[req.username];
        user.ws = ws;
      }else {
        console.log("failed");
        ws.terminate();
      }
    }
    switch(req.method) {
      case 'getUpdates':
        break;
      case 'addFriend':
        var friend = users[req.friendUsername]
        if (friend) {
          if(friend.pendingFriends.indexOf(user.name) != -1 || friend.friends.indexOf(user.name) != -1) {
console.log('1');
            ws.send("Request has already been sent");
          }else if(user.pendingFriends.indexOf(friend.name) != -1) {
console.log('2');
            //add both friends
            user.pendingFriends.splice(user.pendingFriends.indexOf(friend.name), 1);
            friend.friends.push(user.name);
            if (friend.active && friend.ws) {
              friend.ws.send(JSON.stringify({
                method:"friends",
                friends: user.friends,
                friendRequests: user.friends
              }));
            }
            ws.send(JSON.stringify({
                method:"friends",
                friends: user.friends,
                friendRequests: user.friends
            }));
          }else {
console.log('3');
            friend.pendingFriends.push(user.name);
            if(friend.active && friend.ws) {
              friend.ws.send(JSON.stringify({
                method:"friendRequest",
                username:user.name,
              }));
            }
          }
        }
        break;
      //NOT USED NOW
      case 'declineFriendRequest':
        if(user.pendingFriends.indexOf(req.friendUsername) != -1) {
          user.pendingFriends.splice(user.pendingFriends.indexOf(req.friendUsername), 1);
        }
        break;
      case 'getFriends':
        ws.send(JSON.stringify({
          method:"friends",
          friends: user.friends,
          friendRequests: user.friends
        }));
        break;
      case 'requestMeeting':
        break;
      case 'declineMeeting':
        break;
    }
  });

  ws.on('close', function close() {
    user.ws = null;
    console.log('socket closed');
  });
});

server.listen(3000);

