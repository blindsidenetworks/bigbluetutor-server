const deepstream = require('deepstream.io-client-js');
const client = deepstream('ws://tutor-back.blindside-dev.com:6020');

client.login({
  username: 'b',
  password: 'b'
});

client.rpc.make('search', {param:'i'}, (err, data) => {
  for (var user in data) {
    console.log(data[user]);
  }
});
