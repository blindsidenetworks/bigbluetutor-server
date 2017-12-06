const r = require('rethinkdb');
const deepstream = require('deepstream.io-client-js');
const dotenv = require("dotenv");
const winston = require("winston");

const config = dotenv.config().parsed;

winston.level = config.LOG_LEVEL;

const provider = deepstream('localhost:6020');

provider.login({
  username: 'provider'
}, (success, data) => {
  winston.debug("Success:", success);
});
var connection = null;
r.connect( {host: config.DB_HOST, port: parseInt(config.DB_PORT)}, function(err, conn) {
  if (err) {throw err;}
  connection = conn;
});

//provider.event.listen('tutor/.*', function(subject, isSubscribed, response) {
//  if (isSubscribed) {
//    subscribe(subject.split('/')[1], function (tutors, subject) {
//      provider.event.emit('tutor/'+subject, {subject: subject, data: tutors});
//    });
//  }
//});

/*
provider.event.listen('search/.*', function(subject, isSubscribed, response) {
  if (isSubscribed) {
    response.accept();
    subjectTutor(subject.split('/')[1], function (tutors) {
      provider.event.emit(subject, {subject: subject, data: tutors});
    });
  }else {

 }
});
*/


//LISTENERS

provider.event.listen('subject/tutor/.*', function(path, isSubscribed, response) {
  if (isSubscribed) {
    var subject = path.split('/')[2];
    winston.debug(subject);
    subjectTutorSubscribe(subject, function (tutors, subject) {
      provider.event.emit('subject/tutor/'+subject, {subject: subject, data: tutors});
    });
    response.accept();
  } else {
    //Do nothing
  }
});

provider.event.listen('category/tutor/.*', function(path, isSubscribed, response) {
  if (isSubscribed) {
    var subject = path.split('/')[2];
    categoryTutorSubscribe(subject, function (tutors, subject) {
      provider.event.emit('category/tutor/'+subject, {subject: subject, data: tutors});
    });
    response.accept();
  } else {
    //Do nothing
  }
});

//SUBSCRIBE DB Listener
function subjectTutorSubscribe(category, callback) {
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('subjects').contains(category)})
  .changes()
  .run(connection, function(err, cursor) {
    cursor.each(() => {
      r.db('deepstream').table('user').filter(function(tutor) { return tutor('subjects').contains(category)})
      .run(connection, function(err, cursor) {
        if(err) {throw err;}
        cursor.toArray(function(err, result) {
          if (err) {throw err;}
          callback(result, category);
        });
      });
    });
  });
}


function categoryTutorSubscribe(category, callback) {
 r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains(category)})
  .changes()
  .run(connection, function(err, cursor) {
    cursor.each(() => {
      r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains(category)})
      .run(connection, function(err, cursor) {
        if(err) {throw err;}
        cursor.toArray(function(err, result) {
          if (err) {throw err;}
          callback(result, category);
        });
      });
   });
  });
}

//RPCs

provider.rpc.provide('subject/tutor', function (data, response ) {
  var subject = data.subject;
  subjectTutor(subject, function(tutors) {
    response.send({data:tutors, subject: subject});
  });
});

provider.rpc.provide('category/tutor', function (data, response ) {
  var category = data.subject;
  categoryTutor(category, function(tutors) {
    response.send({data:tutors, subject: category});
  });
});

provider.rpc.provide('search', function (data, response) {
  search(data.param, function(result) {
    response.send({data: result});
  })
});

//RPC Query

function subjectTutor(subject, callback) {
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('subjects').contains(subject)})
  .run(connection, function(err, cursor) {
    if (err) {throw err;}
    cursor.toArray(function(err, result) {
      if (err) {throw err;}
      callback(result);
    });
  });
}

function categoryTutor(category, callback) {
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains(category)})
  .run(connection, function(err, cursor) {
    if (err) {throw err;}
    cursor.toArray(function(err, result) {
      if (err) {throw err;}
      callback(result);
    });
  });
}

//Search for tutors who tutor the subject or category searched, or whose usernames match the search term
function search(params, callback) {
  console.time("search");
  r.db('deepstream').table('user')
  .filter(
    function(tutor) {
      return r.or(tutor('categories').contains(function(subject) {
        return subject.match('(?i)'+params)
      }), tutor('subjects').contains(function(subject) {
        return subject.match('(?i)'+params)
      }), tutor('username').match('(?i)'+params))
      .and(tutor("online").eq(true));
    }).orderBy("username").limit(50)
  .run(connection, (err, cursor) => {
    if (err) {throw err;}
    cursor.toArray(function(err, result) {
      callback(result);
      console.timeEnd("search");
    });
  });
}
