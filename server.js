const express = require('express');
const passport = require('passport');
const Strategy = require('passport-http').BasicStrategy;
const googleStrategy = require("passport-google-oauth").OAuth2Strategy;
const expressSession = require("express-session");
const ensureLogin = require("connect-ensure-login");
const bodyParser = require('body-parser');
const deepstream = require('deepstream.io-client-js');
const useExpressMiddleware = require("use-express-middleware");
const deepstreamServer = require("./deepstreamserver").deepstreamServer;
const session = require("./session").session;
/*
var rethinksearch = require('deepstream.io-provider-search-rethinkdb');

var searchProvider = new rethinksearch({logLevel: 3, deepstreamUrl: "localhost:6020", deepstreamCredentials: {username: 'dsp', password:'dp'}, rethinkdbConnectionParams: {host: "localhost", port: 28015, db: "deepstream"}});
searchProvider.start();

const server = deepstream('tutor-back.blindside-dev.com:6020');
*/


var createMeeting = require('./meeting.js');

var app = express();
var server = undefined;

const root = __dirname + "/";
const port = 3000;

var users = {};
var dataRecord;

//Authentication stategy setup
var googleAuth =
{
  clientID: "591220975174-hqfbvf7iuegj6nf1h6jkldeuh3ia72v7.apps.googleusercontent.com",
  clientSecret: "tP3rnW3jYmgVSZ5jw36wCUWv",
  callbackURL: "http://localhost:3000/auth/google/callback",
};

//Express setup
app.use(express.static(root));
app.use(bodyParser.json());
app.use(session);
app.use(passport.initialize());
app.use(passport.session());

//Passport setup
passport.serializeUser(function(user, done)
{
  done(null, user);
});

passport.deserializeUser(function(obj, done)
{
  done(null, obj);
});

passport.use(new googleStrategy({clientID: googleAuth.clientID, clientSecret: googleAuth.clientSecret, callbackURL: googleAuth.callbackURL, passReqToCallback: true},
function(request, accessToken, refreshToken, profile, done)
{
  process.nextTick(function()
  {
    return done(null, profile);
  });
}));


app.use(function(req, res) {
  var username = req.body.authData.username;
  var password = req.body.authData.password;
  console.log(username)
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
    //instantiate with public data
    var user = {
      username:username,
      position: 'no position',
      description: '',
      ratings: {},
      tutor: false
    }
    var userRecord = server.record.getRecord('user/'+user.username);
    userRecord.set(user);
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
//const WebSocket = require('ws');

var https = require('https');
var fs = require('fs');
//var User = require('./user.js');

var options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem'),
  strictSSL: false
}

function authenticate(auth) {
  console.log(auth);
  console.log(users);
  if (auth && auth.username && auth.password && users[auth.username] === auth.password) {
    return true;
  }
  return false;
}

//Deepstream setup
deepstreamServer.on("started", function()
{
  server = deepstream('localhost:6020');

  server.login({
    username: 'server',
    password: 'sp'
  });

  dataRecord = server.record.getRecord('data')
  dataRecord.set('tutors',[]);
  //HARD CODED CATEGORIES FOR NOW HERE
  dataRecord.set('categories',{
    'Language':['English','French','Spanish','German','Mandarin','Japanese','Arabic','Russian'],
    'Math':['Algebra','Calculus','Pre-Calculus','Geometry','Trigonometry'],
    'Business':['Accounting','Business Law', 'Business Management', 'Economics', 'Entrepreneurship', 'Finance', 'Marketing', 'Tax'],
    'Science':['Astronomy', 'Biology', 'Chemistry', 'Physics'],
    'Social Sciences':['Anthropology', 'Geography', 'History'],
    'Arts':['Abstract Art', 'Art History', 'Visual Arts'],
    'Technology':['Artificial Intelligence', 'C', 'C++', 'Human-Computer Interaction', 'Java', 'Javascript', 'Ruby', 'Swift', 'Web Development'],
    'Miscellaneous':['Auctioneering', 'Bagpiping', 'Canadian Studies', 'Mortuary Science', 'Popular Music', 'Recreation and Leisure Studies', 'Viticulture and Enology']
  });

  server.rpc.provide('sendMessage', (data, response) => {
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
              messages = {client:[{user:client,message:message, special: false}]}
            }else if(messages[client]) {
              messages[client].push({user:client,message:message, special: false})
            }else {
              messages[client] = [{user:client,message:message, special: false}]
            }
            record.set('messages',messages);
          });
       });
      }
    });
  });

  server.rpc.provide('requestMeeting', (data, response) => {
    console.log("meeting request");
    var contact = data.contact;
    var client = data.client;
    var data = data.data;
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

            if (clientPendingMeetings.indexOf(contact) != -1) {
              messages[client].push({user: client, message: client+" accepted your meeting request", special: true});
              clientMessages[contact].push({user: client, message: "You accepted the meeting request", special:true});
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
              if (!messages[client]) {
                messages[client] = [];
              }
              if (!clientMessages[contact]) {
                clientMessages[contact] = [];
              }
              messages[client].push({user: client, message: client+" is requesting a meeting", special: true, data: data});
              clientMessages[contact].push({user: client, message: "You requested a meeting", special: true, data: data});
              record.set('messages',messages);
              clientRecord.set('messages',clientMessages);
              pendingMeetings.push(client);
              clientRequestMeetings.push(contact);
              record.set('pendingMeetings', pendingMeetings, () => {
              });
              clientRecord.set('pendingMeetings', clientPendingMeetings);
            }
          });
        });
      }
    });
  });

  server.rpc.provide('registerTutor', (data, response) => {
    if (authenticate(data.auth)) {
      var username = data.auth.username;
      var password = data.auth.password;
      var userRecord = server.record.getRecord('user/'+username);
      var user = userRecord.get();
      //make user tutor
      if (!user.tutor) {
        user.tutor = true;
        user.categories = data.categories;
        var tutors = dataRecord.get('tutors');
        tutors.push(user);
        dataRecord.set('tutors', tutors);
        userRecord.set(user);
      }
    }
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
});

deepstreamServer.start();
app.listen(port, function(){console.log("Listening on port", port)});
