var dotenv = require("dotenv");
var NodePushNotifications = require('node-pushnotifications');
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
const PushNotifications = new NodePushNotifications;
const push = new PushNotifications(settings);

// Single destination
//const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
//const registrationIds = [];
//registrationIds.push('INSERT_YOUR_DEVICE_ID');
//registrationIds.push('INSERT_OTHER_DEVICE_ID');
/*
const data = {
    title: 'New push notification', // REQUIRED
    body: 'Powered by AppFeel', // REQUIRED
    custom: {
        sender: 'AppFeel',
    },
    priority: 'high', // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    collapseKey: '', // gcm for android, used as collapseId in apn
    contentAvailable: true, // gcm for android
    delayWhileIdle: true, // gcm for android
    restrictedPackageName: '', // gcm for android
    dryRun: false, // gcm for android
    icon: '', // gcm for android
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
    alert: {}, // apn, will take precedence over title and body
    // alert: '', // It is also accepted a text message in alert
    titleLocKey: '', // apn and gcm for ios
    titleLocArgs: '', // apn and gcm for ios
    launchImage: '', // apn and gcm for ios
    action: '', // apn and gcm for ios
    topic: '', // apn and gcm for ios
    category: '', // apn and gcm for ios
    contentAvailable: '', // apn and gcm for ios
    mdm: '', // apn and gcm for ios
    urlArgs: '', // apn and gcm for ios
    truncateAtWordEnd: true, // apn and gcm for ios
    mutableContent: 0, // apn
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400, // seconds
    timeToLive: 28 * 86400, // if both expiry and timeToLive are given, expiry will take precedency
    headers: [], // wns
    launch: '', // wns
    duration: '', // wns
    consolidationKey: 'my notification', // ADM
};
*/
/*
// You can use it in node callback style
push.send(registrationIds, data, (err, result) => {
    if (err) {
        winston.error(err);
    } else {
        winston.debug(result);
    }
});

// Or you could use it as a promise:
push.send(registrationIds, data)
  .then((results) => {
  })
  .catch((err) => {
  });
*/

function sendNotification(deviceId, title, message) {

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
    //alert: {}, // apn, will take precedence over title and body
    // alert: '', // It is also accepted a text message in alert
    // titleLocKey: '', // apn and gcm for ios
    // titleLocArgs: '', // apn and gcm for ios
    launchImage: '', // apn and gcm for ios
    action: '', // apn and gcm for ios
    topic: '', // apn and gcm for ios
    category: '', // apn and gcm for ios
    // contentAvailable: '', // apn and gcm for ios
    mdm: '', // apn and gcm for ios
    urlArgs: '', // apn and gcm for ios
    truncateAtWordEnd: true, // apn and gcm for ios
    /*
    mutableContent: 0, // apn
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400, // seconds
    timeToLive: 28 * 86400, // if both expiry and timeToLive are given, expiry will take precedency
    headers: [], // wns
    launch: '', // wns
    duration: '', // wns
    consolidationKey: 'my notification', // ADM
    */
  };


  push.send(deviceId, pushNotification, (err, result) => {
    if (err) {
        winston.error(err);
    } else {
        winston.debug(result);
    }
  });
}

module.exports = sendNotification;
