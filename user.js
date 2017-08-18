function User(name, password) {
  this.username = name;
  this.password = password;
  this.active = true;
  this.friends = [];
  this.pendingFriends = [];
  this.pendingMeetings = [];
  this.ws = null;
  return {
    "username": username,
    "password": password,
    "active": active,
    "friends": friends,
    "pendingFriends": pendingFriends,
    "pendingMeetings":pendingMeetings,
    "ws": ws
  }
};

module.exports = User;
