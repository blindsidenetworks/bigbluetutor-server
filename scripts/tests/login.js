var deepstream = require("deepstream.io-client-js");

var client = deepstream("localhost:6020").on("error", (error) =>
{
  console.log(error);
});

client.login({username: "server", password: "sp"}, (success, data) =>
{
  if(success) {console.log("Login succeeded");}
  else console.log("Login failed");

  console.log("clientData:\n" + data);
});
