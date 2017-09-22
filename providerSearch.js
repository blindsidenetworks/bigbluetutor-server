r = require('rethinkdb');
const deepstream = require('deepstream.io-client-js');
const provider = deepstream('tutor-back.blindside-dev.com:6020');

provider.login({
  username: 'server',
  password: 'sp'
});
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  connection = conn;
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains('English')})
.run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      for (var a in result) {
		console.log(result[a].username);
      }
      //console.log(JSON.stringify(result, null, 2));
    });
  });
  
  provider.event.listen('tutor/.*', function(subject, isSubscribed, response) {
    if (isSubscribed) {
      response.accept();
      var category = subject.split('/')[1];
      provider.event.emit();
    }else {

    }
  });

  provider.event.listen('search/.*', function(subject, isSubscribed, response) { 
    if (isSubscribed) {
      response.accept();
      query(subjectfunction (tutors) { 
        provider.event.emit(subject, {data: );
      }
    }else {
  
    }
  });

});
/*
provider.event.listen('search/.*', function(subject, isSubscribed, response) {
  if (isSubscribed) {
    response.accept();
    
    provider.event.emit();
  }else {
    
  }
});
*/

function query(category, callback) {
  r.db('deepstream').table('user').filter(function(tutor) { return tutor('categories').contains(category)})
  .run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      var tutors = [];
      for (var i in result) {
        tutors.push(result[i].username);
      }
      callback(tutors);
    });
  });
}
