const express = require('express');
var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;
const app = express();
const bodyParser = require('body-parser');
const deepstream = require('deepstream.io-client-js');

const server = deepstream('tutor-back.blindside-dev.com:6020');

var createMeeting = require('./meeting.js');

var users = {}

var dataRecord;

app.use(bodyParser.json())

/*passport.use(new Strategy(
  function(username, password, cb) {
    console.log("HEELOO");
    if (!username){
      cb(false);
    }else if (!users[username]) {
      users[username] = password
      cb(true);
    }else if (users[username] == password) {
      cb(true);
    }else {
      cb(false);
    }
  }
));
//app.use(passport.initialize());
//app.use(passport.session());
app.use(function(req, res, next) {
  var username = req.body.authData.username;
  var password = req.body.authData.password;
  if( req.body.authData) {
    req.headers['username'] = req.body.authData.username;
    req.headers['password'] = req.body.authData.password;
    var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
    req.headers['Authorization'] = auth
    console.log(req.body.authData.username);
    console.log(req.body.authData.password);
  }
  next();
});
app.use(passport.authenticate('basic', { session: false }),
  function(req, res) {
    console.log(req);
    if (req) {
      res.json({
        userId: 'a',
        clientData: { data: 'a' },
        serverData: { role: 'admin' }
      });
    }else {
      res.status(403);
    }
  }
);
*/

app.use(function(req, res) {
  var username = req.body.authData.username;
  var password = req.body.authData.password;
  console.log(username)
  console.log(password)
  var role = "client"
  //hack fix
  if (username === "server" && password === "sp") {
    users[username] = "sp"
    res.json({
      userId: username,
      clientData: { data: 'server' },
      serverData: { id: username, role: 'server' }
    })
  }else if (!username){
    res.status(403).end();
  }else if (!users[username]) {
    //signup
    users[username] = password
    var userList = dataRecord.get('users')
    userList.push(username)
    dataRecord.set('users',userList)
    res.json({
        userId: username,
        clientData: { data: 'client' },
        serverData: { id: username, role: 'client' }
      });
  }else if (users[username] === password) {
    res.json({
        userId: username,
        clientData: { data: 'client' },
        serverData: { id: username, role: 'client' }
      });
  }else {
    res.status(403).end();
  }
});


server.login({
  username: 'server',
  password: 'sp'
});

var tutorRecord = server.record.getRecord('tutor')
tutorRecord.whenReady(() => {
  tutorRecord.set('tutors',[]);
});
dataRecord = server.record.getRecord('data')
dataRecord.set('users',[]);
//HARD CODED CATAGORIES FOR NOW HERE
dataRecord.set('catagories',[
  'English',
  'Math',
  'Chemistry',
  'Physics',
  'Biology',
  'History',
  'Geography',
  'Law',
  'Social Studies',
  'Business',
  'Computer Science',
  'Miscellaneous'
]);
/* DOES NOT NEED PERMISSION TO STAR SOMEONE
server.rpc.provide('starUser', (data, response) => {
  console.log(data);
    var contact = data.contact;
    var client = data.client;
  server.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = server.record.getRecord("profile/"+contact);
      var clientRecord = server.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingContacts = record.get('pendingContacts');
          var contacts = record.get('contacts');
          var clientPendingContacts = clientRecord.get('pendingContacts');
          var clientContacts = clientRecord.get('contacts');
          if (contacts.indexOf(client) == -1 && clientContacts.indexOf(contact) == -1) {
            if (clientPendingContacts.indexOf(contact) != -1) {
              clientContacts.push(contact);
              clientPendingContacts.splice(clientPendingContacts.indexOf(contact), 1);
              if (contacts.indexOf(client) == -1){
                contacts.push(client);
              }
            }else if (pendingContacts.indexOf(client) == -1) {
              pendingContacts.push(client);
            }
            record.set('pendingContacts', pendingContacts, () => {
              record.set('contacts', contacts, () => {
                server.event.emit("profile/"+contact+"/update");
              });
            });
            clientRecord.set('pendingContacts', clientPendingContacts, () => {
              clientRecord.set('contacts', clientContacts, () => {
                server.event.emit("profile/"+client+"/update");
              });
            });
          }
        });
      });
    }
  });
});
*/

server.rpc.provide('sendMessage', (data, response) => {
   console.log(data);
  var contact = data.contact;
  var client = data.client;
  var message = data.message;
  server.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = server.record.getRecord("profile/"+contact);
      var clientRecord = server.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var messages = record.get('messages');
          if (!messages){
            messages = {client:[{user:client,message:message}]}
          }else if(messages[client]) {
            messages[client].push({user:client,message:message})
          }else {
            messages[client] = [{user:client,message:message}]
          }
          record.set('messages',messages)
        });
     });
    }
  });
});

server.rpc.provide('requestMeeting', (data, response) => {
  console.log("meeting request");
  var contact = data.contact;
  var client = data.client;
  if (client === contact) { return }
  server.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = server.record.getRecord("profile/"+contact);
      var clientRecord = server.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingMeetings = record.get('pendingMeetings');
          var clientPendingMeetings = clientRecord.get('pendingMeetings');
          var requestMeetings = record.get('requestMeetings');
          var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          if (clientPendingMeetings.indexOf(contact) != -1 && requestMeetings.indexOf(client) != -1) {
            messages[client].push({user: client, message: client+" accepted your meeting request"});
            clientMessages[contact].push({user: client, message: "You accepted the meeting request"});
            record.set('messages',messages);
            clientRecord.set('messages',clientMessages);

            clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
            requestMeetings.splice(requestMeetings.indexOf(client), 1);
            //create meeting here
            createMeeting(contact + '/' + client, contact, function(meetingUrl) {
              record.set('meeting', meetingUrl);
            });
            createMeeting(contact + '/' + client, client, function(meetingUrl) {
              clientRecord.set('meeting', meetingUrl);
            });
          } else if (pendingMeetings.indexOf(client) == -1) {
            messages[client].push({user: client, message: client+" is requesting a meeting"});
            clientMessages[contact].push({user: client, message: "You requested a meeting"});
            record.set('messages',messages);
            clientRecord.set('messages',clientMessages);
            pendingMeetings.push(client);
            clientRequestMeetings.push(contact);
            record.set('pendingMeetings', pendingMeetings, () => {
              record.set('requestMeetings', requestMeetings, () => {
                server.event.emit("profile/"+contact+"/update");
              });
            });
            clientRecord.set('pendingMeetings', clientPendingMeetings, () => {
              clientRecord.set('requestMeetings', clientRequestMeetings, () => {
                server.event.emit("profile/"+client+"/update");
              });
            });
          }
        });
      });
    }
  });
});

server.rpc.provide('tutor', (data, response) => {
  var username = data.username;
  var password = data.password;
  var record = tutorRecord;
  record.whenReady(() => {
    var tutors = record.get('tutors')
    if (users[username] === password && tutors.indexOf(username)==-1) {
      tutors.push(username);
      record.set('tutors', tutors);
    }
  });
});

//Get user's messages
server.rpc.provide('getMessages', (data, response) =>{
  var username = data.username;
  var record = server.record.getRecord("messages");
  record.whenReady(() => {
    response.send(record.get("messages"));
  });
});

server.event.listen('createMeeting/.*/.*', function(match, isSubscribed, response) {
  console.log('meeting create');
});

//const WebSocket = require('ws');

var https = require('https');
var fs = require('fs');
//var User = require('./user.js');

var options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem'),
  strictSSL: false
}

/*var users = {};
var inactiveUsers = [];

app.use(bodyParser.json());

app.post('/api/register', function(req, res) {
  if (req.body && req.body.auth && req.body.auth.username && req.body.auth.password) {
    var username = req.body.auth.username.trim();
    if (username.indexOf(' ') == -1) {
      if (users[req.body.auth.username]) {
        res.status(409).send('USERNAME HAVE ALREADY BEEN TAKEN');
      }else {
        var user = User(req.body.auth.username, req.body.auth.password);
        users[req.body.auth.username] = User(req.body.auth.username, req.body.auth.password);
        res.send('USER REGISTERED');
      }
    }else {
      res.status(400).send("Username cannot contain spaces");
    
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


app.post('/api/login', function(req, res) { 
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
          if(friend.pendingFriends.indexOf(user.username) != -1 || friend.friends.indexOf(user.username) != -1) {
            ws.send("Request has already been sent");
          }else if(user.pendingFriends.indexOf(friend.username) != -1) {
            //add both friends
            user.pendingFriends.splice(user.pendingFriends.indexOf(friend.username), 1);
            user.friends.push(friend.username);
            friend.friends.push(user.username);
            if (friend.active && friend.ws) {
//              var friendData = [];
//              for(friend in friend.friends) {
//                if(users[friend].ws) {
//                  friendData.push({username: friend, active: true});
//                }else {
//                  friendData.push({username: friend, active: false});
//                }
//              }
              friend.ws.send(JSON.stringify({
                method:"friends",
                friends: friend.friends,
                friendRequests: friend.pendingFriends
              }));
            }
//            var friendData = [];
//            for(friend in user.friends) {
//              if(users[friend].ws) {
//                friendData.push({username: friend, active: true});
//              }else {
//                friendData.push({username: friend, active: false});
//              }
//            }
            ws.send(JSON.stringify({
                method:"friends",
                friends: user.friends,
                friendRequests: user.pendingFriends
            }));
          }else {
            friend.pendingFriends.push(user.username);
            if(friend.active && friend.ws) {
              friend.ws.send(JSON.stringify({
                method:"friendRequest",
                username:user.username,
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
//        var friendData = [];
//        for(friend in user.friends) {
//          if(users[friend].ws) {
//            friendData.push({username: friend, active: true});
//          }else {
//            friendData.push({username: friend, active: false});
//          }
//        }
        ws.send(JSON.stringify({
          method:"friends",
          friends: user.friends,
          friendRequests: user.pendingFriends
        }));
        break;
      case 'requestMeeting':
        var friend = users[req.friendUsername];
        if(friend && friend.friends.indexOf(user.username)!=-1) {
          if(user.pendingMeetings.indexOf(friend.username)==-1) {
            if(friend.pendingMeetings.indexOf(user.username)==-1) {
              friend.pendingMeetings.push(user.username);
              if(friend.ws) {
                friend.ws.send(JSON.stringify({
                  method: "meetingRequest",
                  username: user.username
                }));
              }
            }
          }else {
            user.pendingMeetings.splice(user.pendingMeetings.indexOf(friend.username),1);
            if(friend.ws){
              createMeeting(friend.username + ' ' + user.username, user.username, function(meetingUrl) {
                ws.send(JSON.stringify({
                  method:"meeting",
                  url: meetingUrl
                }));             
              });
              createMeeting(friend.username + ' ' + user.username, friend.username, function(meetingUrl){
                friend.ws.send(JSON.stringify({
                  method:"meeting",
                  url: meetingUrl
                }));             
              });
            }
          }
        }
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
*/
//var server = https.createServer(options, app);
//server.listen(3000);
app.listen(3000);
