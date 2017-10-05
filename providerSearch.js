r = require('rethinkdb');
const deepstream = require('deepstream.io-client-js');
const provider = deepstream('tutor-back.blindside-dev.com:6020');

var activeSessions = {};

provider.login({
  username: 'provider',
  password: 'sp'
}, (success, data) => {
  console.log(success);
});
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  connection = conn;
});

//provider.event.listen('tutor/.*', function(subject, isSubscribed, response) {
//  if (isSubscribed) {
//    subscribe(subject.split('/')[1], function (tutors, subject) {
//      provider.event.emit('tutor/'+subject, {subject: subject, data: tutors});
//    });
//  }else {
//    console.log('tutor listen ended');
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

provider.event.listen('subject/tutor/.*', function(subject, isSubscribed, response) {
  if (isSubscribed) {
    subjectTutorSubscribe(subject.split('/')[1], function (tutors, subject) {
      provider.event.emit('subject/tutor/'+subject, {subject: subject, data: tutors});
    });
  }else {
    console.log('tutor listen ended');
  }
});

provider.event.listen('category/tutor/.*', function(subject, isSubscribed, response) {
  if (isSubscribed) {
    categoryTutorSubscribe(subject.split('/')[1], function (tutors, subject) {
      provider.event.emit('category/tutor/'+subject, {subject: subject, data: tutors});
    });
  }else {
    console.log('tutor listen ended');
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
        if(err) throw err;
        cursor.toArray(function(err, result) {
          if (err) throw err;
          var tutors = [];
          for (var i in result) {
            tutors.push(result[i]);
          }
          callback(tutors, category);
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
        if(err) throw err;
        cursor.toArray(function(err, result) {
          if (err) throw err;
          var tutors = [];
          for (var i in result) {
            tutors.push(result[i]);
          }
          callback(tutors, category);
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
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      var tutors = [];
      for (var i in result) {
        tutors.push(result[i]);
      }
      callback(tutors);
    });
  });
}

function categoryTutor(category, callback) {
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains(category)})
  .run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      var tutors = [];
      for (var i in result) {
        tutors.push(result[i]);
      }
      callback(tutors);
    });
  });
}

function search(params, callback) {
  r.db('deepstream').table('user')
  .filter(
    function(tutor) {
      return tutor('categories').contains(function(subject) {
        return subject.match(params)
      })
      .or(tutor('subjects').contains(function(subject) {
        return subject.match(params)
      }))
      .or(tutor('username').match(params));
    })
//  .orderBy(function(tutor) {
//      return tutor('username').split("").count()
//    })
  .run(connection, (err, cursor) => {
    if (err) throw err
    cursor.toArray(function(err, result) {
      var tutors = [];
      r.expr(result).orderBy('username').limit(50);
      callback(result);
    })
  });
  
}
