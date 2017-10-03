const deepstream = require('deepstream.io-client-js');
var rethinksearch = require('deepstream.io-provider-search-rethinkdb');

//Deepstream setup
//const client = deepstream('tutor-back.blindside-dev.com:6020');
const client = deepstream('localhost:6020');

var searchProvider = new rethinksearch({logLevel: 3, deepstreamUrl: "localhost:6020", deepstreamCredentials: {username: 'rethinkdb'}, rethinkdbConnectionParams: {host: "localhost", port: 28015, db: "deepstream"}});
searchProvider.start();

var createMeeting = require('./meeting.js');

var users = {};
var dataRecord;

/*
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
    var userRecord = client.record.getRecord('user/'+user.username);
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
*/

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

client.login({
  username: 'server',
  password: 'sp'
});

dataRecord = client.record.getRecord('data')
dataRecord.set('tutors',[]);
//HARD CODED CATEGORIES FOR NOW HERE
dataRecord.set('categories',{
  'Language':['English','French','Spanish', 'Italian', 'German','Mandarin','Japanese','Arabic','Russian', 'Latin'],
  'Math':['Algebra','Calculus','Pre-Calculus','Geometry','Trigonometry'],
  'Business':['Accounting','Business Law', 'Business Management', 'Economics', 'Entrepreneurship', 'Finance', 'Marketing', 'Tax'],
  'Science':['Astronomy', 'Biology', 'Chemistry', 'Physics'],
  'Social Sciences':['Anthropology', 'Geography', 'History'],
  'Arts':['Abstract Art', 'Art History', 'Visual Arts'],
  'Technology':['Artificial Intelligence', 'C', 'C++', 'Human-Computer Interaction', 'Java', 'Javascript', 'Ruby', 'Swift', 'Web Development'],
  'Miscellaneous':['Auctioneering', 'Bagpiping', 'Canadian Studies', 'Mortuary Science', 'Popular Music', 'Recreation and Leisure Studies', 'Viticulture and Enology']
});

client.rpc.provide('sendMessage', (data, response) => {
  var contact = data.contact;
  var client = data.client;
  var message = data.message;
  client.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = client.record.getRecord("profile/"+contact);
      var clientRecord = client.record.getRecord("profile/"+client);
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

client.rpc.provide('requestMeeting', (data, response) => {
  console.log("meeting request");
  var contact = data.contact;
  var client = data.client;
  var data = data.data;
  if (client === contact) { return }
  client.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = client.record.getRecord("profile/"+contact);
      var clientRecord = client.record.getRecord("profile/"+client);
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

client.rpc.provide('registerTutor', (data, response) => {
  if (authenticate(data.auth)) {
    var username = data.auth.username;
    var password = data.auth.password;
    var userRecord = client.record.getRecord('user/'+username);
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
client.rpc.provide('getMessages', (data, response) =>
{
  var username = data.username;
  var record = client.record.getRecord("messages");
  record.whenReady(() => {
    response.send(record.get("messages"));
  });
});

//Create a new user record with a new username
client.rpc.provide("createUser", (data, response) =>
{
  console.log("Creating user");
  console.log(data);

  //No ID or username provided, so do nothing
  if(!data || !data.googleID || data.googleID === "")
  {
    console.log("Not enough data provided to create user");
    response.send({success: false});
    return;
  }
  if(!data.username || data.username === "")
  {
    console.log("Invalid username");
    response.send({success: false, error: "Please enter a valid username"});
    return;
  }

  var googleID = data.googleID;
  var username = data.username.toLowerCase();

  //Do not create a new user if one with a matching Google ID already exists
  client.record.has("googleID/" + googleID, (error, hasRecord) =>
  {
    if(error)
    {
      console.log(error);
      response.send({success: false});
      return;
    }

    if(hasRecord)
    {
      //User with Google ID already exists, so do nothing
      console.log("Google ID", googleID, "already exists");
      response.send({success: false});
      return;
    }

    //Do not create a new user if one with the given username already exists
    client.record.has("profile/" + username, (error, hasRecord) =>
    {
      if(error)
      {
        console.log(error);
        response.send({success: false});
        return;
      }

      if(hasRecord)
      {
        //User with given username already exists, so do nothing
        console.log("User with username", username, "already exists");
        response.send({success: false, error: "This username is already in use"});
        return;
      }

      client.record.getRecord("profile/" + username).whenReady(userRecord =>
      {
        var user = userRecord.get();

        if(!user)
        {
          console.log("Error getting the user record");
          response.send({success: false});
          return;
        }

        //If the record already exists with a valid username, do nothing. Otherwise, fill it with the user's information
        if(!user.username && !user.googleID)
        {
          user =
          {
            googleID: googleID,
            username: username,
            position: 'no position',
            description: '',
            ratings: {},
            tutor: false,
            onboardingComplete: false
          };
          userRecord.set(user);

          //Create a record to link the user's Google ID with their username
          client.record.getRecord("googleID/" + googleID).whenReady(googleRecord =>
          {
            var google = googleRecord.get();

            if(!google)
            {
              console.log("Error getting the Google ID record");
              response.send({success: false});
              return;
            }

            if(!google.username && !google.googleID)
            {
              google = {username: username, googleID: googleID};
              googleRecord.set(google);
            }
            response.send({success: true});
          });
        }
        else
        {
          response.send(false);
        }
      });
    });
  });
});

client.event.listen('createMeeting/.*/.*', function(match, isSubscribed, response) {
  console.log('meeting create');
});
