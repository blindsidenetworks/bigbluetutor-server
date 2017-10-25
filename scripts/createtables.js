var Deepstream = require("deepstream.io");
var RethinkDB = require("deepstream.io-storage-rethinkdb");
var deepstreamClient = require("deepstream.io-client-js");
var dotenv = require("dotenv");

var config = dotenv.config().parsed;
const server = new Deepstream("conf/config.yml");
//We need to wait some time until the tables are created before deleting the test records
const waitTime = 2000;
var tables = ["auth", "profile", "user"];

server.set("storage", new RethinkDB({port: 28015, host: "localhost", database: "deepstream", defaultTable: "deepstream_records", splitChar: "/"}));
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
  //The script will exit once all 4 records have been deleted
  var j = 0;
  function exitIfDone()
  {
    if(++j === tables.length + 1)
    {
      dsClient.close();
      server.stop();
      process.exit();
    }
  }

  dsClient.login({username: "server", password: "sp"}, () =>
  {
    dsClient.record.getRecord("test").whenReady(record =>
    {
      record.on("delete", () => {exitIfDone();});
      setTimeout(() => {record.delete()}, waitTime);
    });
    for(i = 0; i < tables.length; ++i)
    {
      dsClient.record.getRecord(tables[i] + "/test").whenReady(record =>
      {
        record.on("delete", () => {exitIfDone();});
        setTimeout(() => {record.delete()}, waitTime);
      });
    }
  });
});

server.start();
