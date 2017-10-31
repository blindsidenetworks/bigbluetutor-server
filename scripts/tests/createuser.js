/*
Test cases:
Success
Username already in use
Blank username
No username
No Google ID
*/

var deepstream = require("deepstream.io-client-js");

var client = deepstream("localhost:6020").on("error", (error) =>
{
  console.log(error);
});

client.login({username: "server", password: "sp"}, (success, data) =>
{
  if(!success) return;

  console.log(data);

  //Success
  client.rpc.make("createUser", {username: "test", googleID: -1}, (error, result) =>
  {
    if(error)
    {
      console.log(error);
      return;
    }
    console.log(result);

    //Username already in use
    client.rpc.make("createUser", {username: "test", googleID: -1}, (error, result) =>
    {
      if(error)
      {
        console.log(error);
        return;
      }
      console.log(result);

      //Blank username
      client.rpc.make("createUser", {username: "", googleID: -1}, (error, result) =>
      {
        if(error)
        {
          console.log(error);
          return;
        }
        console.log(result);

        //No username
        client.rpc.make("createUser", {googleID: -1}, (error, result) =>
        {
          if(error)
          {
            console.log(error);
            return;
          }
          console.log(result);

          //No Google ID
          client.rpc.make("createUser", {username: "test"}, (error, result) =>
          {
            if(error)
            {
              console.log(error);
              return;
            }
            console.log(result);
          });
        });
      });
    });
  });
});
