var deepstream = require("deepstream.io");
var rethinkdb = require("deepstream.io-storage-rethinkdb");
var deepstreamClient = require("deepstream.io-client-js");
var dotenv = require('dotenv');
var r = require("rethinkdb");

var config = dotenv.config().parsed;

const server = new deepstream("conf/config.yml");

var dsClient;

server.set("storage", new rethinkdb({port: parseInt(config.DB_PORT), host: config.DB_HOST, database: config.DB_NAME, defaultTable: config.DB_DEFAULT_TABLE, splitChar: "/"}));
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
  dsClient.login({username: "server", password: "sp"}, () =>
  {
    dsClient.record.getRecord("auth/test").whenReady(record =>
    {
      dsClient.record.getRecord("test").whenReady(record =>
      {
        dsClient.record.getRecord("profile/test").whenReady(record =>
        {
          dsClient.record.getRecord("user/test").whenReady(record =>
          {
            dsClient.close();
            server.stop();
            process.exit();
          })
        });
      });
    });
  });
});

server.start();
