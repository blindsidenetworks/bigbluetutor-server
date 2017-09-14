var express = require("express");
var passport = require("passport")
var googleStrategy = require("passport-google-oauth").OAuth2Strategy;

var app = express();
var server = require("http").createServer(app);
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");

var googleAuth =
{
  clientID: "591220975174-hqfbvf7iuegj6nf1h6jkldeuh3ia72v7.apps.googleusercontent.com",
  clientSecret: "tP3rnW3jYmgVSZ5jw36wCUWv",
  callbackURL: "http://localhost:8080/auth/google/callback", //You may need to change the port here and in server.listen
};

var twitterAuth =
{
  clientID: "",
  clientSecret: "",
  callbackURL: "http://localhost:8080/auth/twitter/callback",
};

var facebookAuth =
{
  clientID: "",
  clientSecret: "",
  callbackURL: "http://localhost:8080/auth/facebook/callback",
};

const root = __dirname + "/";
var users = {};

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.use(session({name: "Session", secret: "nyan", resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done)
{
  done(null, user);
});

passport.deserializeUser(function(user, done)
{
  done(null, user);
});

passport.use(new googleStrategy({clientID: googleAuth.clientID, clientSecret: googleAuth.clientSecret, callbackURL: googleAuth.callbackURL, passReqToCallback: true},
function(request, accessToken, refreshToken, profile, done)
{
  process.nextTick(function()
  {
    return done(null, profile);
  });
}));

app.get("*", function(req ,res, next)
{
  console.log("GET request for " + req.url);
  console.log("User: " + req.user);
  next();
});

app.get("/", function(req, res)
{
  res.sendFile(root + "welcome.html");
});

app.get("/login", function(req, res)
{
  res.sendFile(root + "login.html");
});

app.get("/profile", function(req, res)
{
  if(!req.isAuthenticated())
    res.redirect("/login");
  else
    res.send(req.user);
});

app.get("/auth/google", passport.authenticate("google", {scope: ['https://www.googleapis.com/auth/plus.login']}));
app.get("/auth/google/callback", passport.authenticate("google", {successRedirect: "/profile", failureRedirect: "/login"}));

app.get("/logout", function(req, res)
{
  req.logout();
  res.redirect("/");
});

app.get("*", function(req,res)
{
  res.send("404 not found");
});

server.listen(8080);
console.log("Listening on port 8080");

