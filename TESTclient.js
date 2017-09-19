const deepstream = require('deepstream.io-client-js');
const client = deepstream('ws://tutor-back.blindside-dev.com:6020');

client.login({
  username: 'b',
  password: 'b'
});

client.event.emit('addContact');
client.event.emit('createMeeting');
