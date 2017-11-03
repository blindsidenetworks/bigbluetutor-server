var crypto = require('crypto');
var https = require('https');
var dotenv = require("dotenv");

var config = dotenv.config().parsed;

function createRoom(meetingId, fullName, callback) {
  const defaultModeratorPassword = "mp";
  const defaultAttendeePassword = "ap";
  var meetingId = meetingId.split(' ').join('+');
  var fullName = fullName.split(' ').join('+');
  var url = config.BIGBLUEBUTTON_URL + 'bigbluebutton/api/create?';
  var params = 'name=' + meetingId + '&meetingID=' + meetingId  + '&attendeePW=' + defaultAttendeePassword + '&moderatorPW=' + defaultModeratorPassword + '&record=false';
  var checksum = crypto.createHash('sha1').update('create' + params + config.BIGBLUEBUTTON_SECRET).digest('hex');
  url += params + '&checksum=' + checksum;

  https.get(url, function(res) {
    var meetingUrl = config.BIGBLUEBUTTON_URL + 'bigbluebutton/api/join?';
    var voiceBridge = Math.floor(Math.random() * (90000) + 10000);
    var params = 'fullName=' + fullName + '&meetingID=' + meetingId + '&password=' + defaultAttendeePassword + '&voiceBridge=' + voiceBridge + '&redirectClient=true&clientURL=' + config.BIGBLUEBUTTON_URL + 'html5client/join';
    var checksum = crypto.createHash('sha1').update('join' + params + config.BIGBLUEBUTTON_SECRET).digest('hex');
    meetingUrl += params + '&checksum=' + checksum;
    console.log(meetingUrl);
    callback(meetingUrl);
  });
}

module.exports = createRoom;
