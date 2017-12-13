var dotenv = require("dotenv");
const winston = require("winston");
const config = dotenv.config().parsed;

winston.level = config.LOG_LEVEL;

const settings = {
    gcm: {
        id: config.PUSH_SERVER_KEY,
        phonegap: true
    },
    apn: {
        token: {
            key: './certs/key.p8', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: 'ABCD',
            teamId: 'EFGH',
        },
    },
    adm: {
        client_id: null,
        client_secret: null,
    },
    wns: {
        client_id: null,
        client_secret: null,
        notificationMethod: 'sendTileSquareBlock',
    }
};
const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);
const gcm = require('node-gcm');


var sender = new gcm.Sender.('AIzaSyAzpT2EGeXxpupjaMiokYNikvKflqJtkoY');

// Single destination
//const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
//const registrationIds = [];
//registrationIds.push('INSERT_YOUR_DEVICE_ID');
//registrationIds.push('INSERT_OTHER_DEVICE_ID');

function sendNotification(tokens, title, message) {

  var androidTokens = tokens.filter(token => token.version === "react-native" && token.platform === 'android');
  var appleTokens = tokens.filter(token => token.version === "react-native" && token.platform === 'ios');
  var ionicTokens = tokens.filter(token => token.version === "ionic");

  


  var pushNotification = {
    title: title, // REQUIRED
    body: message, // REQUIRED
    custom: {
        sender: 'BigBlueTutor',
    },
    priority: 'high', // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    collapseKey: '', // gcm for android, used as collapseId in apn
    contentAvailable: true, // gcm for android
    delayWhileIdle: true, // gcm for android
    restrictedPackageName: '', // gcm for android
    dryRun: false, // gcm for android
    icon: 'myicon', // gcm for android
    tag: '', // gcm for android
    color: '', // gcm for android
    clickAction: '', // gcm for android. In ios, category will be used if not supplied
    locKey: '', // gcm, apn
    bodyLocArgs: '', // gcm, apn
    titleLocKey: '', // gcm, apn
    titleLocArgs: '', // gcm, apn
    retries: 1, // gcm, apn
    encoding: '', // apn
    badge: 2, // gcm for ios, apn
    sound: 'ping.aiff', // gcm, apn
    launchImage: '', // apn and gcm for ios
    action: '', // apn and gcm for ios
    topic: '', // apn and gcm for ios
    category: '', // apn and gcm for ios
    mdm: '', // apn and gcm for ios
    urlArgs: '', // apn and gcm for ios
    truncateAtWordEnd: true, // apn and gcm for ios
  };

  var message = new gcm.Message({
    collapseKey: '',
    priority: 'high',
    delayWhileIdle: true,
    notification: {
      title: "Hello, World",
      icon: "ic_launcher",
      body: "This is a notification that will be displayed if your app is in the background."
    }
  });

  if(androidTokens.length()) {
    var deviceTokens = androidTokens.map(a => a.token);
    sender.send(message, { registrationTokens: deviceTokens }, function (err, response) {
      if(err) console.error(err);
      else console.log(response);
    });
  }

  if(ionicTokens.length()) {
    var deviceTokens = ionicTokens.map(a => a.token);
    push.send(deviceTokens, pushNotification, (err, result) => {
      if (err) {
        winston.error(err);
      } else {
        winston.debug(result);
      }
    });
  }
}



module.exports = sendNotification;
