function User(name, password) {
  this.name = name;
  this.password = password;
  this.active = true;
  this.friends = [];
  this.pendingFriends = [];
  this.ws = null;
  return {
    "name": name,
    "password": password,
    "active": active,
    "friends": friends,
    "pendingFriends": pendingFriends,
    "ws": ws
  }
};

module.exports = User;
