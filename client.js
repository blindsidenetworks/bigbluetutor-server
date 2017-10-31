const deepstream = require('deepstream.io-client-js');

//Deepstream setup
const deepstreamClient = deepstream('localhost:6020').on("error", error =>
{
  console.log(error);
});

deepstreamClient.login({
  username: 'server',
  password: 'sp'
}, function(success, data)
{
  console.log("Success:", success);
  console.log("Data:", data);
});

var createMeeting = require('./meeting.js');

var dataRecord = deepstreamClient.record.getRecord('data');
//HARD CODED CATEGORIES FOR NOW HERE
dataRecord.set('categories',{
  'Language':['English','French','Spanish', 'Italian', 'German','Mandarin','Japanese','Arabic','Russian', 'Latin'],
  'Math':['Algebra','Calculus','Pre-Calculus','Geometry','Trigonometry'],
  'Business':['Accounting','Business Law', 'Business Management', 'Economics', 'Entrepreneurship', 'Finance', 'Marketing', 'Tax'],
  'Science':['Astronomy', 'Biology', 'Chemistry', 'Physics'],
  'Social Sciences':['Anthropology', 'Geography', 'History'],
  'Arts':['Abstract Art', 'Art History', 'Visual Arts']
});

deepstreamClient.rpc.provide('changeDescription', (data, response) => {
  var username = data.username;
  deepstreamClient.record.getRecord('user/'+username).whenReady(userRecord =>
  {
    var user = userRecord.get();

    user.description = data.description;
    userRecord.set(user);
    response.send({});
  });
});

deepstreamClient.rpc.provide('requestMeeting', (data, response) => {
  var contact = data.contact;
  var client = data.client;
  var data = data.data;
  if (client === contact) { return }
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      var userRecord = deepstreamClient.record.getRecord("user/"+contact);
      var clientUserRecord = deepstreamClient.record.getRecord("user/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingMeetings = record.get('pendingMeetings');
          var clientPendingMeetings = clientRecord.get('pendingMeetings');
          var requestMeetings = record.get('requestMeetings');
          var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          if (clientPendingMeetings.indexOf(contact) != -1) {

            var i = -1;
            messages[client].messages.some(function(item, index) {
              if(item.active) {
                i = index;
                return true;
              }
              return false;
            });

            if (i!=-1) {
              messages[client].messages.splice(i,1,{user: client, message: "session in progress", special: "ActiveSession", active: false});
              record.set('messages', messages);
            }

            i = -1;
            clientMessages[contact].messages.some(function(item, index) {
              if(item.active) {
                i = index;
                return true;
              }
              return false;
            });

            if (i!=-1) {
              clientMessages[contact].messages.splice(i,1,{user: client, message: "session in progress", special: "ActiveSession", active: false});
              clientRecord.set('messages', clientMessages);
            }

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
            userRecord.whenReady(() => {
            clientUserRecord.whenReady(() => {
            if (!messages[client]) {
              messages[client] = {pic: clientUserRecord.get('profilePic'),messages:[]};
            }
            if (!clientMessages[contact]) {
              clientMessages[contact] = {pic: userRecord.get('profilePic'),messages:[]};
            }

            if (!messages[client]) {
              messages[client] = [];
            }
            if (!clientMessages[contact]) {
              clientMessages[contact] = [];
            }

            messages[client].messages.push({user: client, message: "Meeting Request" , special: "IncomingRequest", active: true, data: data});
            clientMessages[contact].messages.push({user: client, message: "Waiting for " + client, special: "OutgoingRequest", active: true, data: data});
            record.set('messages',messages);
            clientRecord.set('messages',clientMessages);
            pendingMeetings.push(client);
            clientRequestMeetings.push(contact);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);
            });
            });
          }
        });
      });
    }
  });
  response.send({});
});

deepstreamClient.rpc.provide('declineMeeting', (data, response) => {
  var contact = data.contact;
  var client = data.client;
  var data = data.data;
  if (client === contact) { return }
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingMeetings = record.get('pendingMeetings');
          var clientPendingMeetings = clientRecord.get('pendingMeetings');
          var requestMeetings = record.get('requestMeetings');
          var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          var i = -1;
          messages[client].messages.some(function(item, index) {
              if(item.active) {
                i = index;
                return true;
              }
              return false;
            });

          if (i!=-1) {
            messages[client].messages.splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
            record.set('messages', messages);
          }

          i = -1;
          clientMessages[contact].messages.some(function(item, index) {
              if(item.active) {
                i = index;
                return true;
              }
              return false;
            });

          if (i!=-1) {
            clientMessages[contact].messages.splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
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
  response.send({});
});

deepstreamClient.rpc.provide('registerTutor', (data, response) => {
  console.log("registerTutor");
  var username = data.username;
  deepstreamClient.record.getRecord('user/'+username).whenReady(userRecord =>
  {
    var user = userRecord.get();

    //check for broader subjects
    var subjects = [];
    var categoryList = dataRecord.get('categories');
    var categories = Array.from(new Set(data.categories || []));
    if(categories.length === 0)
    {
      response.send({});
      return;
    }

    for(var category in categoryList) {
      if (categoryList.hasOwnProperty(category) && subjects.indexOf(category) == -1) {
        for (var subcategory = 0; subcategory < categoryList[category].length; ++subcategory) {
          if(categories.indexOf(categoryList[category][subcategory]) != -1) {
            subjects.push(category);
            break;
          }
        }
      }
    }


    //make user tutor
    if (!user.tutor)
    {
      user.tutor = true;
      user.subjects = subjects;
      user.categories = categories;
      userRecord.set(user);
      response.send({});
    }
  });
});

deepstreamClient.rpc.provide('sendMessage', (data, response) => {
  var contact = data.contact;
  var client = data.client;
  var message = data.message;
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      //profilePicture
      var userRecord = deepstreamClient.record.getRecord('user/'+client);
      userRecord.whenReady(() => {
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var messages = record.get('messages');
          if (!messages){
            messages = {client:{pic: userRecord.get('profilePic'), messages:[{user:client,message:message, special: false}]}}
          }else if(messages[client]) {
            messages[client].messages.push({user:client,message:message, special: false})
          }else {
            messages[client] = {pic: userRecord.get('profilePic'),messages: [{user:client,message:message, special: false}]}
          }
          record.set('messages',messages);
        });
     });
     });
    }
  });
  repsonse.send({});
});

//Create a new user record with a new username
//Also creates a profile record. The profile record stores private user data, while the user record stores public data
deepstreamClient.rpc.provide("createUser", (data, response) =>
{
  console.log("Creating user");
  console.log(data);

  //No ID or username provided, so do nothing
  if(!data || !data.googleID || data.googleID === "")
  {
    console.log("Error: Not enough data provided to create user");
    response.send({username: undefined});
    return;
  }
  if(!data.username || data.username === "")
  {
    console.log("Error: Invalid username");
    response.send({username: undefined, error: "Please enter a username"});
    return;
  }

  var googleID = data.googleID;
  var username = data.username.toLowerCase();

  //Do not create a new user if a profile record with the given username already exists
  deepstreamClient.record.has("profile/" + username, (error, hasRecord) =>
  {
    if(error)
    {
      console.log(error);
      response.send({username: undefined, error: "An error occurred. Please try again"});
      return;
    }
    if(hasRecord)
    {
      //Profile with given username already exists, so do nothing
      console.log("Error: Profile with username", username, "already exists");
      response.send({username: undefined, error: "This username is already in use"});
      return;
    }

    //Do not create a new user if a user record with the given username already exists
    deepstreamClient.record.has("user/" + username, (error, hasRecord) =>
    {
      if(error)
      {
        console.log(error);
        response.send({username: undefined, error: "An error occurred. Please try again"});
        return;
      }
      if(hasRecord)
      {
        //User with given username already exists, so do nothing
        console.log("Error: User with username", username, "already exists");
        response.send({username: undefined, error: "This username is already in use"});
        return;
      }

      deepstreamClient.record.has("auth/" + username, (error, hasRecord) =>
      {
        if(error)
        {
            console.log(error);
            response.send({username: undefined, error: "An error occurred. Please try again"});
            return;
        }
        if(hasRecord)
        {
            console.log("Error: Auth record with username", username, "already exists");
            response.send({username: undefined, error: "An error occurred. Please try again"});
            return;
        }

        deepstreamClient.record.getRecord("profile/" + username).whenReady(profileRecord =>
        {
          var profile = profileRecord.get();

          if(!profile)
          {
            console.log("Error getting the profile record");
            response.send({username: undefined, error: "An error occurred. Please try again"});
            return;
          }
          //If the record already exists with a valid username or Google ID, do nothing. Otherwise, fill it with the user's profile information
          if(profile.username)
          {
            console.log("Error: Profile record with matching username already exists");
            response.send({username: undefined, error: "This username is already in use"});
            return;
          }

          profile =
          {
            username: username,
            onboardingComplete: false,
            stars: [],
            pendingMeetings: [],
            requestMeetings: [],
            messages: {},
            meeting: ""
          };
          profileRecord.set(profile);

          deepstreamClient.record.getRecord("user/" + username).whenReady(userRecord =>
          {
            var user = userRecord.get();

            if(!user)
            {
              console.log("Error getting the profile record");
              response.send({username: undefined, error: "An error occurred. Please try again"});
              return;
            }
            //If the record already exists with a valid username or Google ID, do nothing. Otherwise, fill it with the user's information
            if(user.username)
            {
              console.log("Error: User record with matching username already exists");
              response.send({username: undefined, error: "This username is already in use"});
              return;
            }

            user =
            {
              username: username,
              profilePic: "http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png",
              position: 'no position',
              description: '',
              ratings: {},
              tutor: false,
            };
            userRecord.set(user);

            deepstreamClient.record.getRecord("auth/" + username).whenReady(authRecord =>
            {
              var auth = authRecord.get();

              if(!auth)
              {
                console.log("Error getting the auth record");
                response.send({username: undefined, error: "An error occurred. Please try again"});
                return;
              }
              //If the record already exists with a valid username or Google ID, do nothing. Otherwise, fill it with the user's information
              if(auth.username)
              {
                console.log("Error: Auth record with matching username already exists");
                response.send({username: undefined, error: "This username is already in use"});
                return;
              }

              auth =
              {
                username: username,
                googleID: googleID
              };
              authRecord.set(auth);

              response.send({username: username});
            }); //Get auth
          }); //Get user
        }); //Get profile
      }); //Has auth
    }); //Has user
  }); //Has profile
});
