const RethinkDB = require("deepstream.io-storage-rethinkdb");
const r = require("rethinkdb");
const dotenv = require("dotenv");
var config = dotenv.config().parsed;

r.connect({host: config.DB_HOST, port: config.DB_PORT}, (error, conn) => {
  if(error) {throw error;}
  r.db("deepstream").table("profile").update({onboardingComplete: true}).run(conn, (error, callback) => {
    if(error) {throw error;}
    console.log(callback);
    return;
  });
});

