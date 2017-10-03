var deepstream = require("deepstream.io");
var rethinkdb = require("deepstream.io-storage-rethinkdb");
const bodyParser = require('body-parser');
var googleAuth = require("google-auth-library");

var server = new deepstream("conf/config.yml");

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
        if(error || !login)
        {
          console.log(error);
          callback("Access denied");
        }
        else
        {
          var payload = login.getPayload();
          callback(true, payload.sub);
        }
      });
    }
    else if(authData && authData.username === "rethinkdb")
    {
      callback(true, "RethinkDB");
    }
    else if(authData && authData.username === "server")
    {
      callback(true, "server");
    }
    /*
    else if(connectionData.remoteAddress === "127.0.0.1")
    {
      callback(true, "server");
    }
    */
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
