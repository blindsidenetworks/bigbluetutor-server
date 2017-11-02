var createMeeting = require('./createMeeting.js');

function getActiveItem(item)
{
  return item.active;
}

function provide(deepstreamClient)
{
  deepstreamClient.rpc.provide('requestMeeting', (data, response) => {
    var contact = data.contact;
    var client = data.client;
    // var data = data.data;
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
              return;
            }

            if (clientPendingMeetings.indexOf(contact) != -1) {

              var i = messages[client].messages.findIndex(getActiveItem);
              var j = clientMessages[contact].messages.findIndex(getActiveItem);

              if (record.get('meeting') != '') {
                if (i!==-1) {
                  messages[client].messages.splice(i,1,{user: contact, message: "Session Declined", special: "DeclinedRequest", active: false});
                  record.set('messages', messages);
                }

                if (j!==-1) {
                  clientMessages[contact].messages.splice(j,1,{user: contact, message: "Session Declined", special: "DeclinedRequest", active: false});
                  clientRecord.set('messages', clientMessages);
                }
                return;
              } else {
                record.set('meeting',true);
                if (i!==-1) {
                  messages[client].messages.splice(i,1,{user: client, message: "session in progress", special: "ActiveSession", active: true});
                  record.set('messages', messages);
                }

                if (j!==-1) {
                  clientMessages[contact].messages.splice(j,1,{user: client, message: "session in progress", special: "ActiveSession", active: true});
                  clientRecord.set('messages', clientMessages);
                }

              }

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
            } else if (pendingMeetings.indexOf(client) == -1) {
              userRecord.whenReady(() => {
                clientUserRecord.whenReady(() => {
                if (!messages[client]) {
                  messages[client] = {pic: clientUserRecord.get('profilePic'), messages:[]};
                }
                if (!clientMessages[contact]) {
                  clientMessages[contact] = {pic: userRecord.get('profilePic'), messages:[]};
                }

                if( data && data.categories) {
                  clientMessages[contact].messages.push({user: client, message: 'I would like to request a tutoring session for '+data.categories+'. The preferred tutoring session length is '+data.time+' minutes.', special: false});
                  messages[client].messages.push({user: client, message: 'I would like to request a tutoring session for '+data.categories+'. The preferred tutoring session length is '+data.time+' minutes.', special: false});
                }

                messages[client].messages.push({user: client, message: "Meeting Request" , special: "IncomingRequest", active: true, data: data});
                clientMessages[contact].messages.push({user: client, message: "Waiting for " + client, special: "OutgoingRequest", active: true, data: data});
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
  });

  deepstreamClient.rpc.provide('declineMeeting', (data, response) => {
    var contact = data.contact;
    var client = data.client;
    // var data = data.data;
    if (client === contact) { return }
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

            var i = messages[client].messages.findIndex(getActiveItem);

            if (i!==-1) {
              messages[client].messages.splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
              record.set('messages', messages);
            }

            i = clientMessages[contact].messages.findIndex(getActiveItem);

            if (i!==-1) {
              clientMessages[contact].messages.splice(i,1,{user: client, message: "Session Declined", special: "DeclinedRequest", active: false});
              clientRecord.set('messages', clientMessages);
            }

            clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
            requestMeetings.splice(requestMeetings.indexOf(client), 1);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);
          });
        });
      }
    });
    response.send({});
  });

  deepstreamClient.rpc.provide('endMeeting', (data, response) => {
    var contact = data.contact;
    var client = data.client;
    // var data = data.data;
    if (client === contact) { return }
    deepstreamClient.record.has("profile/"+contact, (err, has) => {
      if (has) {
        var record = deepstreamClient.record.getRecord("profile/"+contact);
        var clientRecord = deepstreamClient.record.getRecord("profile/"+client);
        record.whenReady(() => {
          clientRecord.whenReady(() => {
            var pendingMeetings = record.get('pendingMeetings');
            var clientPendingMeetings = clientRecord.get('pendingMeetings');
            var requestMeetings = record.get('requestMeetings');
            var clientRequestMeetings = clientRecord.get('requestMeetings');
            var messages = record.get('messages');
            var clientMessages = clientRecord.get('messages');

            var i = messages[client].messages.findIndex(getActiveItem);

            if (i!==-1) {
              messages[client].messages.splice(i,1,{user: client, message: "Session Ended", special: "EndedSession", active: false});
              record.set('messages', messages);
            }

            i = clientMessages[contact].messages.findIndex(getActiveItem);

            if (i!==-1) {
              clientMessages[contact].messages.splice(i,1,{user: client, message: "Session Ended", special: "EndedSession", active: false});
              clientRecord.set('messages', clientMessages);
            }

            clientPendingMeetings.splice(clientPendingMeetings.indexOf(contact), 1);
            requestMeetings.splice(requestMeetings.indexOf(client), 1);
            record.set('pendingMeetings', pendingMeetings);
            clientRecord.set('pendingMeetings', clientPendingMeetings);
            clientRecord.set('meeting','');
            record.set('meeting','');
          });
        });
      }
    });
    response.send({});
  });
}

module.exports.provide = provide;
