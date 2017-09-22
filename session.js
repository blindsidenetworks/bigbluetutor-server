var express = require("express");
var expressSession = require("express-session");
var passport = require("passport");

var session = expressSession({name: "Session", secret: "nyan", resave: true, saveUninitialized: true});

module.exports.session = session;
