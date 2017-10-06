var deepstream = require("deepstream.io");
var rethinkdb = require("deepstream.io-storage-rethinkdb");
var deepstreamClient = require("deepstream.io-client-js");
const bodyParser = require('body-parser');
var googleAuth = require("google-auth-library");

const server = new deepstream("conf/config.yml");

//Google auth setup
var googleClientID = "591220975174-hqfbvf7iuegj6nf1h6jkldeuh3ia72v7.apps.googleusercontent.com";

var auth = new googleAuth();
var client = new auth.OAuth2(googleClientID, "", "");

//Deepstream setup
server.set("authenticationHandler",
{
  isValidUser: function(connectionData, authData, callback)
  {
    if(authData.idToken)
    {
      client.verifyIdToken(authData.idToken, googleClientID, (error, login) =>
      {
        if(error)
        {
          console.log(error);
          callback(null, "Access denied");
        }
        else if(!login)
        {
          callback(null, "Access denied");
        }
        else
        {
          var payload = login.getPayload();
          var client = deepstreamClient('localhost:6020').login({
            username: 'server',
            password: 'sp'
          }, function(success, data)
          {
            if(!success)
              return;
            var query = JSON.stringify({table: "profile", query: [["googleID", "match", payload.sub]]});
            client.record.getList("search?" + query).whenReady(list =>
            {
              console.log(list.getEntries());
              callback(true, {username: payload.sub, serverData:{idToken: authData.idToken, role: "user"}});
            });
          });
        }
      });
    }
    else if(connectionData.remoteAddress === "127.0.0.1")
    {
      callback(true, {username: "SERVER", serverData:{role: "server"}});
    }
    else
    {
      callback("Access denied");
    }
  },
  canPerformAction: function(id, message, callback)
  {
    callback(null, true);
  },
  isReady: true
});

server.set("storage", new rethinkdb({port: 28015, host: "localhost", database: "deepstream", defaultTable: "deepstream_records", splitChar: "/"}));

server.start();
