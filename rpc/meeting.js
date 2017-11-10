var deepstreamClient;
var createMeeting = require('./createMeeting.js');

function getActiveItem(item)
{
  return item.active;
}

function meetingMessage(messages, clientMessages, statusMessage, infoMessage)
{
  var activeMeeting = messages.findIndex(getActiveItem);
  var activeClientMeeting = clientMessages.findIndex(getActiveItem);

  if (activeMeeting!==-1) {
    if(statusMessage) {messages[activeMeeting] = statusMessage;}
    if(infoMessage) {messages.push(infoMessage);}
  }

  if (activeClientMeeting!==-1) {
    if(statusMessage) {clientMessages[activeClientMeeting] = statusMessage;}
    if(infoMessage) {clientMessages.push(infoMessage);}
  }
}

function requestMeeting(data, response)
{
  //client: the user requesting the meeting
  //contact: the user the client wants to meet with
  var contact = data.contact;
  var client = data.client;
  var specialData = data.data;
  if (client === contact) { return }
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      var userRecord = deepstreamClient.record.getRecord("user/"+contact);
      var clientUserRecord = deepstreamClient.record.getRecord("user/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingMeetings = record.get('pendingMeetings');
          var clientPendingMeetings = clientRecord.get('pendingMeetings');
          var requestMeetings = record.get('requestMeetings');
          var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          if(clientRecord.get('meeting') !== '') {
            //do nothing for now
            return;
          }

          if (clientPendingMeetings.indexOf(contact) !== -1) {

            //can't accept if requested user is in meeting
            if (record.get('meeting') !== '') {
              meetingMessage(messages[client].messages, clientMessages[contact].messages,
                {user: contact, message: "Session Declined", special: "DeclinedRequest", active: false},
                {user: contact, message: "Sorry, I am currently in another meeting. Please try again later.", special: false, active: false});
              record.set('messages', messages);
              clientRecord.set('messages', clientMessages);
              clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
              requestMeetings.splice(requestMeetings.indexOf(client), 1);
              record.set('pendingMeetings', pendingMeetings);
              clientRecord.set('pendingMeetings', clientPendingMeetings);
              return;
            }

            //Accept the request and start a meeting
            meetingMessage(messages[client].messages, clientMessages[contact].messages,
              {user: client, message: "Session in progress", special: "ActiveSession", active: true});

            record.set('messages', messages);
            clientRecord.set('messages', clientMessages);
            clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
            requestMeetings.splice(requestMeetings.indexOf(client), 1);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);

            //create meeting here
            createMeeting(contact + '/' + client, contact, function(meetingUrl) {
              record.set('meeting', meetingUrl);
            });
            createMeeting(contact + '/' + client, client, function(meetingUrl) {
              clientRecord.set('meeting', meetingUrl);
            });
          } else if (pendingMeetings.indexOf(client) === -1) {
            userRecord.whenReady(() => {
              clientUserRecord.whenReady(() => {
              if (!messages[client]) {
                messages[client] = {pic: clientUserRecord.get('profilePic'), messages:[]};
              }
              if (!clientMessages[contact]) {
                clientMessages[contact] = {pic: userRecord.get('profilePic'), messages:[]};
              }

              if(specialData && specialData.categories && specialData.time) {
                clientMessages[contact].messages.push({user: client, message: 'I would like to request a tutoring session for '+specialData.categories+'. The preferred tutoring session length is '+specialData.time+' minutes.', special: false});
                messages[client].messages.push({user: client, message: 'I would like to request a tutoring session for '+specialData.categories+'. The preferred tutoring session length is '+specialData.time+' minutes.', special: false});
              }

              messages[client].messages.push({user: client, message: "Meeting Request" , special: "IncomingRequest", active: true, data: specialData});
              clientMessages[contact].messages.push({user: client, message: "Waiting for " + client, special: "OutgoingRequest", active: true, data: specialData});
              record.set('messages',messages);
              clientRecord.set('messages',clientMessages);
              pendingMeetings.push(client);
              clientRequestMeetings.push(contact);
              record.set('pendingMeetings', pendingMeetings);
              clientRecord.set('pendingMeetings', clientPendingMeetings);
              });
            });
          }
        });
      });
    }
  });
  response.send({});
}

function declineMeeting(data, response)
{
  var contact = data.contact;
  var client = data.client;
  // var specialData = data.data;
  if (client === contact) { return; }
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          var pendingMeetings = record.get('pendingMeetings');
          var clientPendingMeetings = clientRecord.get('pendingMeetings');
          var requestMeetings = record.get('requestMeetings');
          // var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          meetingMessage(messages[client].messages, clientMessages[contact].messages,
            {user: client, message: "Session Declined", special: "DeclinedRequest", active: false});

          record.set('messages', messages);
          clientRecord.set('messages', clientMessages);
          clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
          requestMeetings.splice(requestMeetings.indexOf(client), 1);
          record.set('pendingMeetings', pendingMeetings);
          clientRecord.set('pendingMeetings', clientPendingMeetings);
        });
      });
    }
  });
  response.send({});
}

function endMeeting(data, response)
{
  var contact = data.contact;
  var client = data.client;
  // var specialData = data.data;
  if (client === contact) { return; }
  deepstreamClient.record.has("profile/"+contact, (err, has) => {
    if (has) {
      var record = deepstreamClient.record.getRecord("profile/"+contact);
      var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
      record.whenReady(() => {
        clientRecord.whenReady(() => {
          // var pendingMeetings = record.get('pendingMeetings');
          // var clientPendingMeetings = clientRecord.get('pendingMeetings');
          // var requestMeetings = record.get('requestMeetings');
          // var clientRequestMeetings = clientRecord.get('requestMeetings');
          var messages = record.get('messages');
          var clientMessages = clientRecord.get('messages');

          meetingMessage(messages[client].messages, clientMessages[contact].messages,
            {user: client, message: "Session Ended", special: "EndedSession", active: false});

          record.set('messages', messages);
          clientRecord.set('messages', clientMessages);
          clientRecord.set('meeting','');
          record.set('meeting','');
        });
      });
    }
  });
  response.send({});
}

module.exports = function(dsClient)
{
  deepstreamClient = dsClient;
  return {requestMeeting: requestMeeting, declineMeeting: declineMeeting, endMeeting: endMeeting};
}
