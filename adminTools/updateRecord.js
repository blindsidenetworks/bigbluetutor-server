const RethinkDB = require("deepstream.io-storage-rethinkdb");
const r = require("rethinkdb");
const dotenv = require("dotenv");
var config = dotenv.config().parsed;

r.connect({host: config.DB_HOST, port: config.DB_PORT}, (error, conn) => {
  if(error) {throw error;}

  r.db('deepstream').table('profile')
  .run(conn, function(err, cursor) {
    if (err) {throw err;}
    cursor.toArray(function(err, profiles) {
      if (err) {throw err;}
      console.log(profiles);
      for (var i in profiles) {
        var newMessagesCount = {};
        if(profiles[i].messages && Object.keys(profiles[i].messages).length > 0) {
          for (var j in profiles[i].messages) {
            newMessagesCount[j] = 0;
          }
          r.db("deepstream").table("profile").filter({'username':profiles[i].username}).update({newMessagesCount: newMessagesCount}).run(conn, (error, result) => {
             if(error) {throw error;}
             console.log(result);
          });

        } else {
          r.db("deepstream").table("profile").filter({'username':profiles[i].username}).update({newMessagesCount: {}}).run(conn, (error, result) => {
             if(error) {throw error;}
             console.log(result);
          });
        }
      }
    });
  });
/*
  r.db("deepstream").table("profile").update({newMessagesCount: {}}).run(conn, (error, callback) => {
    if(error) {throw error;}
    console.log(callback);
    return;
  });
*/
});

