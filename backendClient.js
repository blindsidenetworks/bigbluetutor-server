const deepstream = require('deepstream.io-client-js');
const client = deepstream('tutor-back.blindside-dev.com:6020');


client.login({
  username: 'abc',
  password: 'def'
});

client.event.emit('profile/A/add', {});
client.record.getRecord('profile/A/requests').set({'abc':''});
