var deepstreamClient;

function getUserDataError(profile, user, auth)
{
  //Check for errors getting the records, or if a user already exists
  if(!profile)
  {
    console.log("Error getting the profile record");
    return "An error occurred. Please try again";
  }
  if(profile.username)
  {
    console.log("Error: Profile record with matching username already exists");
    return "This username is already in use"
  }
  if(!user)
  {
    console.log("Error getting the user record");
    return "An error occurred. Please try again"
  }
  if(user.username)
  {
    console.log("Error: User record with matching username already exists");
    return "This username is already in use"
  }
  if(!auth)
  {
    console.log("Error getting the auth record");
    return "An error occurred. Please try again"
  }
  if(auth.username)
  {
    console.log("Error: Auth record with matching username already exists");
    return "This username is already in use"
  }
  return null;
}

function createUser(data, response)
{
  console.log("Creating user");
  console.log(data);

  var googleID = data.googleID;
  var username = data.username;

  //No ID or username provided, so do nothing
  if(!data || !data.googleID || data.googleID === "")
  {
    console.log("Error: No Google ID provided");
    response.send({username: undefined, error: "No Google ID provided"});
    return;
  }
  if(!data.username || data.username === "")
  {
    console.log("Error: Invalid username");
    response.send({username: undefined, error: "Please enter a username"});
    return;
  }

  username = username.toLowerCase();

  //Do not create a new user if a profile record with the given username already exists
  deepstreamClient.record.has("profile/" + username, (error, hasRecord) =>
  {
    if(error)
    {
      console.log(error);
      response.send({username: undefined, error: "An error occurred. Please try again"});
      return;
    }
    if(hasRecord)
    {
      //Profile with given username already exists, so do nothing
      console.log("Error: Profile with username", username, "already exists");
      response.send({username: undefined, error: "This username is already in use"});
      return;
    }

    //Do not create a new user if a user record with the given username already exists
    deepstreamClient.record.has("user/" + username, (error, hasRecord) =>
    {
      if(error)
      {
        console.log(error);
        response.send({username: undefined, error: "An error occurred. Please try again"});
        return;
      }
      if(hasRecord)
      {
        //User with given username already exists, so do nothing
        console.log("Error: User with username", username, "already exists");
        response.send({username: undefined, error: "This username is already in use"});
        return;
      }

      deepstreamClient.record.has("auth/" + username, (error, hasRecord) =>
      {
        if(error)
        {
            console.log(error);
            response.send({username: undefined, error: "An error occurred. Please try again"});
            return;
        }
        if(hasRecord)
        {
            console.log("Error: Auth record with username", username, "already exists");
            response.send({username: undefined, error: "An error occurred. Please try again"});
            return;
        }

        deepstreamClient.record.getRecord("profile/" + username).whenReady(profileRecord =>
        {
          deepstreamClient.record.getRecord("user/" + username).whenReady(userRecord =>
          {
            deepstreamClient.record.getRecord("auth/" + username).whenReady(authRecord =>
            {
              var profile = profileRecord.get();
              var user = userRecord.get();
              var auth = authRecord.get();

              var userError = getUserDataError(profile, user, auth);
              if(userError)
              {
                response.send({username: undefined, error: userError});
                return;
              }

              //No errors, so create user
              profile =
              {
                username: username,
                onboardingComplete: false,
                stars: [],
                pendingMeetings: [],
                requestMeetings: [],
                messages: {},
                meeting: ""
              };
              profileRecord.set(profile);

              user =
              {
                username: username,
                profilePic: "http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png",
                position: 'no position',
                description: '',
                ratings: {},
                tutor: false,
              };
              userRecord.set(user);

              auth =
              {
                username: username,
                googleID: googleID
              };
              authRecord.set(auth);

              response.send({username: username});
            }); //Get auth
          }); //Get user
        }); //Get profile

      }); //Has auth
    }); //Has user
  }); //Has profile
}

module.exports = function(dsClient)
{
  deepstreamClient = dsClient;
  return {createUser: createUser};
};
