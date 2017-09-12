const deepstream = require('deepstream.io-client-js');
const rethinksearch = require('deepstream.io-provider-search-rethinkdb');

const client = deepstream('tutor-back.blindside-dev.com:6020');
const searchprovider = new rethinksearch({listName: "search", logLevel: 3, deepstreamClient: client, rethinkdbConnectionParams: {host: "localhost", port: 28015, db: "deepstream"}});

client.login({
  username: 'abc',
  password: 'def'
});

searchprovider.start();


var messages = client.record.getRecord("messages");
messages.set({messages: ["Hi", "Hello", "Hey", "What's goin' on?"]}, () =>
{
  /*
  client.rpc.make('getMessages', {username: "A"}, (err, result) =>
  {
    if(!err)
      console.log(result);
  })
  */
});


var str = JSON.stringify({table: "table", query: [["n", "lt", 45]]});

client.record.getList("search?" + str).whenReady(list => {console.log(list.getEntries())});
