var deepstream = require("deepstream.io");
var rethinkdb = require("deepstream.io-storage-rethinkdb");
var deepstreamClient = require("deepstream.io-client-js");
var googleAuth = require("google-auth-library");
var r = require("rethinkdb");

const server = new deepstream("conf/config.yml");
var connection = null;

//Google auth setup
var googleClientID = "591220975174-hqfbvf7iuegj6nf1h6jkldeuh3ia72v7.apps.googleusercontent.com";

var auth = new googleAuth();
var client = new auth.OAuth2(googleClientID, "", "");
var dsClient;

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
          callback(null, {username: "Access denied", clientData: {googleError: true}});
          return;
        }
        if(!login)
        {
          console.log("Error: can't get payload from idToken");
          callback(null, {username: "Access denied", clientData: {googleError: true}});
          return;
        }
        var payload = login.getPayload();
        console.log(login.getPayload());
        //Check if a user with a matching Google ID exists in the database
        r.db("deepstream").table("auth").filter(r.row("googleID").eq(payload.sub)).run(connection, (error, cursor) =>
        {
          if(error)
          {
            console.log(error);
            callback(null, {username: "Access denied"});
            return;
          }
          cursor.toArray(function(error, profiles)
          {
            if(error)
            {
              console.log(error);
              callback(null, {username: "Access denied"});
              return;
            }
            console.log(profiles);
            if(profiles.length === 1 && profiles[0].username)
            {
              //Found user, so set the profile picture and log the user in with their username
              dsClient.record.getRecord("profile/" + profiles[0].username).whenReady(userRecord =>
              {
                userRecord.set("profilePic", payload.picture);
                callback(true, {username: profiles[0].username, serverData:{idToken: authData.idToken, role: "user"}, clientData: {username: profiles[0].username}});
              });
            }
            else if(profiles.length > 1)
            {
              //There should be at most one user with the given Google ID
              console.log("Error: more than one user with given Google ID");
              callback(null, {username: "Access denied"});
            }
            else if("username" in authData && authData.username !== undefined && authData.username !== null)
            {
              //No user found, so user needs to set a username to create an account
              //If a username was requested, attempt to create the account. Otherwise, do not log in
              console.log("Creating user with username", authData.username);
              dsClient.rpc.make("createUser", {googleID: payload.sub, username: authData.username}, (error, result) =>
              {
                if(error)
                {
                  console.log(error);
                  callback(null, {username: "Access denied", clientData: result});
                }
                else if(result.username)
                {
                  //User creation succeeded
                  dsClient.record.getRecord("profile/" + profiles[0].username).whenReady(userRecord =>
                  {
                    userRecord.set("profilePic", payload.picture);
                    callback(true, {username: result.username, serverData:{idToken: authData.idToken, role: "user"}, clientData: result});
                  });
                }
                else
                {
                  //No username was returned, so creating the user failed
                  callback(null, {username: "Access denied", clientData: result});
                }
              });
            }
            else
            {
              console.log("Error: no user with matching Google ID exists and no username was given. Redirecting to account creation page");
              callback(null, {username: "Access denied", clientData: {needsUsername: true}});
            }
          });
        });

      });
    }
    else if(connectionData.remoteAddress === "127.0.0.1" && authData.password === "sp")
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

server.set("storage", new rethinkdb({port: 28015, host: "localhost", database: "deepstream", defaultTable: "deepstream_records", splitChar: "/"}));
r.connect({host: "localhost", port: "28015"}, function(error, conn)
{
  if(error) throw error;
  connection = conn;
});

server.on("started", () =>
{
  dsClient = deepstreamClient('localhost:6020').on("error", error =>
  {
    console.log(error);
  });
  dsClient.login({
    username: 'server',
    password: 'sp'
  });
});

server.start();
