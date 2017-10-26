var Deepstream = require("deepstream.io");
var RethinkDB = require("deepstream.io-storage-rethinkdb");
var deepstreamClient = require("deepstream.io-client-js");
var dotenv = require("dotenv");

var config = dotenv.config().parsed;
const server = new Deepstream("conf/config.yml");

var profiles =
[
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'jason thompson', 'meeting': '', 'password': ''},
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'onboardingComplete': false, 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'sally smith', 'meeting': ''},
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'adam wong', 'meeting': '', 'password': ''},
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'onboardingComplete': false, 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'john doe', 'meeting': ''},
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'onboardingComplete': false, 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'jane doe', 'meeting': ''},
  {'profilePic': 'http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png', 'stars': [], 'onboardingComplete': false, 'requestMeetings': [], 'messages': {}, 'pendingMeetings': [], 'username': 'julia mcdonald', 'meeting': ''}
];

var users =
[
  {'categories': ['Tax', 'Accounting', 'Biology', 'Geography'], 'ratings': {}, 'tutor': true, 'username': 'jason thompson', 'description': 'I like business', 'position': 'no position', 'subjects': ['Business', 'Science', 'Social Sciences']},
  {'ratings': {}, 'tutor': false, 'username': 'sally smith', 'description': 'I like math and history', 'position': 'no position'},
  {'ratings': {}, 'tutor': false, 'username': 'adam wong', 'description': 'I like to study the arts.', 'position': 'no position'},
  {'categories': ['Visual Arts', 'Algebra', 'Chemistry', 'Physics', 'Astronomy', 'History'], 'ratings': {}, 'tutor': true, 'username': 'john doe', 'description': 'I love science', 'position': 'no position', 'subjects': ['Arts', 'Math', 'Science', 'Social Sciences']},
  {'categories': ['Abstract Art', 'Astronomy', 'Anthropology', 'Finance', 'Entrepreneurship'], 'ratings': {}, 'tutor': true, 'username': 'jane doe', 'description': 'I like business', 'position': 'no position', 'subjects': ['Arts', 'Business', 'Science', 'Social Sciences']},
  {'ratings': {}, 'tutor': false, 'username': 'julia mcdonald', 'description': '', 'position': 'no position'}
];

server.set("storage", new RethinkDB({port: parseInt(config.DB_PORT), host: config.DB_HOST, database: config.DB_NAME, defaultTable: config.DB_DEFAULT_TABLE, splitChar: "/"}));
server.set("authenticationHandler",
{
  isValidUser: function(connectionData, authData, callback)
  {
    if(connectionData.remoteAddress === "127.0.0.1" && authData.password === "sp")
    {
      callback(true, {username: "SERVER", serverData:{role: "server"}});
    }
    else
    {
      callback({username: "Access denied"});
    }
  },
  canPerformAction: function(id, message, callback)
  {
    callback(null, true);
  },
  isReady: true
});

server.on("started", () =>
{
  var dsClient = deepstreamClient('localhost:6020').on("error", error => {console.log(error);});
  var j = 0;
  var exitIfDone = function()
  {
    if(j === profiles.length + users.length)
    {
      dsClient.close();
      server.stop();
      process.exit();
    }
    else
    {
      setTimeout(exitIfDone, 100);
    }
  }

  dsClient.login({username: "server", password: "sp"}, () =>
  {
    var i;
    for(i = 0; i < profiles.length; ++i)
    {
      (function(i)
      {
        dsClient.record.getRecord("profile/" + profiles[i].username).whenReady(record =>
        {
          record.set(profiles[i]);
          ++j;
        })
      })(i);
    }
    for(i = 0; i < profiles.length; ++i)
    {
      (function(i)
      {
        dsClient.record.getRecord("user/" + users[i].username).whenReady(record =>
        {
          record.set(users[i]);
          ++j;
        });
      })(i);
    }
    exitIfDone();
  });
});

server.start();
