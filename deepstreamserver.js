var deepstream = require("deepstream.io");
var rethinkdb = require("deepstream.io-storage-rethinkdb");
var express = require("express");
var useExpressMiddleware = require("use-express-middleware");
var passport = require("passport");
var session = require("./session").session;

var deepstreamServer = new deepstream("conf/config.yml");

//Deepstream setup
deepstreamServer.set("authenticationHandler",
{
  isValidUser: function(connectionData, authData, callback)
  {
    useExpressMiddleware(connectionData.headers, [session, passport.initialize(), passport.session()], function(req, res)
    {
      req.session.cookie.httpOnly = false;
      if(req.user)
      {
        callback(true, req.user.id);
      }
      else if(authData && authData.username === "rethinkdb")
      {
          callback(true, "RethinkDB");
      }
      else if(authData && authData.username === "server")
      {
          callback(true, "server");
      }
      else
      {
        callback("Access denied");
      }
    });
  },
  canPerformAction: function(id, message, callback)
  {
    callback(null, true);
  },
  isReady: true
});
deepstreamServer.set("storage", new rethinkdb({port: 28015, host: "localhost", database: "deepstream", defaultTable: "deepstream_records", splitChar: "/"}));

module.exports.deepstreamServer = deepstreamServer;
