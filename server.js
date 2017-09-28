const express = require('express');
var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;
const app = express();
const bodyParser = require('body-parser');
const deepstream = require('deepstream.io-client-js');

var rethinksearch = require('deepstream.io-provider-search-rethinkdb');

const server = deepstream('tutor-back.blindside-dev.com:6020');


var createMeeting = require('./meeting.js');

var users = {}

var dataRecord;

app.use(bodyParser.json())

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
  }else if(username==="provider"){
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

            var i = messages[client].some(function(item, index) {
              if(item.active) {
                return index;
              } 
            });

            if (i!=-1) {
              messages[client].splice(i,1,{user: client, message: "session in progress", special: "ActiveSession", active: false});
              record.set('messages', messages);
            }
            
            i = clientMessages[contact].some(function(item, index) {
              if(item.active) {
                return index;
              }
            });

            if (i!=-1) {
              clientMessages[contact].splice(i,1,{user: client, message: "session in progress", special: "ActiveSession", active: false});
              clientRecord.set('messages', clientMessages);
            }

            //messages[client].push({user: client, message: "session in progress", special: "ActiveSession", active: true});
            //clientMessages[contact].push({user: client, message: "session in progress", special: "ActiveSession", active: true});
            //record.set('messages',messages);
            //clientRecord.set('messages',clientMessages);

            clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
            requestMeetings.splice(requestMeetings.indexOf(client), 1);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);

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

            if (!messages[client]) {
              messages[client] = [];
            }
            if (!clientMessages[contact]) {
              clientMessages[contact] = [];
            }

            messages[client].push({user: client, message: "Meeting Request" , special: "IncomingRequest", active: true, data: data});
            clientMessages[contact].push({user: client, message: "Waiting for " + client, special: "OutgoingRequest", active: true, data: data});
            record.set('messages',messages);
            clientRecord.set('messages',clientMessages);
            pendingMeetings.push(client);
            clientRequestMeetings.push(contact);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);
          }
        });
      });
    }
  });
});

server.rpc.provide('declineMeeting', (data, response) => {
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

          var i = messages[client].some(function(item, index) {
              if(item.active) {
                return index;
              }
            });

          if (i!=-1) {
            messages[client].splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
            record.set('messages', messages);
          }

          i = clientMessages[contact].some(function(item, index) {
              if(item.active) {
                return index;
              }
            });

          if (i!=-1) {
            clientMessages[contact].splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
            clientRecord.set('messages', clientMessages);
          }

          clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
          requestMeetings.splice(requestMeetings.indexOf(client), 1);
          record.set('pendingMeetings', pendingMeetings);
          clientRecord.set('pendingMeetings', clientPendingMeetings);
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

    //check for broader subjects
    var subjects = [];
    var categoryList = dataRecord.get('categories');
    var categories = data.categories;
    for(var category in categoryList) {
      if (subjects.indexOf(category) == -1) {
        for (subcategory in categoryList[category]) {
          if(categories.indexOf(categoryList[category][subcategory]) != -1) {
            subjects.push(category);
            break;
          }
        }
      }
    }

    //make user tutor
    if (!user.tutor) {
      user.tutor = true;
      user.subjects = subjects;
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


app.listen(3000);
