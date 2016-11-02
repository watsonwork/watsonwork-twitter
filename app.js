import express from 'express';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import zipcode from 'zipcode';
import request from "request";
import Twitter from 'twitter';

// Watson Work Services URL
const watsonWork = "https://api.watsonwork.ibm.com";

// Application Id, obtained from registering the application at https://developer.watsonwork.ibm.com
const appId = process.env.TWITTER_CLIENT_ID;

// Application secret. Obtained from registration of application.
const appSecret = process.env.TWITTER_CLIENT_SECRET;

// Webhook secret. Obtained from registration of a webhook.
const webhookSecret = process.env.TWITTER_WEBHOOK_SECRET;

// Twitter API keys obtained via: https://apps.twitter.com (see README for more info)
// a JSON object with all the authentication info for Twitter
const twitter_auth = { 
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}
// Keyword to "listen" for when receiving outbound webhook calls.
const webhookKeyword = "@twitter";

const failMessage =
`Hey, maybe it's me... maybe it's Twitter, but I sense the fail whale should be here... Try again later`;

const successMessage = (username, tweetText, tweetId) => {
  return `*Tweet* from [@${username}](http://twitter.com/${username}): ${tweetText}. Click [here](https://twitter.com/${username}/status/${tweetId}) to view more. \r\n\r\n`;
};

const app = express();
const client = new Twitter(twitter_auth);

// Send 200 and empty body for requests that won't be processed.
const ignoreMessage = (res) => {
  res.status(200).end();
}

// Process webhook verification requests
const verifyCallback = (req, res) => {
  console.log("Verifying challenge");

  const bodyToSend = {
    response: req.body.challenge
  };

  // Create a HMAC-SHA256 hash of the recieved body, using the webhook secret
  // as the key, to confirm webhook endpoint.
  const hashToSend =
    crypto.createHmac('sha256', webhookSecret)
    .update(JSON.stringify(bodyToSend))
    .digest('hex');

  res.set('X-OUTBOUND-TOKEN', hashToSend);
  res.send(bodyToSend).end();
};

// Validate events coming through and process only message-created or verification events.
const validateEvent = (req, res, next) => {

  // Event to Event Handler mapping
  const processEvent = {
    'verification': verifyCallback,
    'message-created': () => next()
  };

  // If event exists in processEvent, execute handler. If not, ignore message.
  return (processEvent[req.body.type]) ?
    processEvent[req.body.type](req, res) : ignoreMessage(res);
};

// Authenticate Application
const authenticateApp = (callback) => {

  // Authentication API
  const authenticationAPI = 'oauth/token';

  const authenticationOptions = {
    "method": "POST",
    "url": `${watsonWork}/${authenticationAPI}`,
    "auth": {
      "user": appId,
      "pass": appSecret
    },
    "form": {
      "grant_type": "client_credentials"
    }
  };

  request(authenticationOptions, (err, response, body) => {
    // If can't authenticate just return
    if (response.statusCode != 200) {
      console.log("Error authentication application. Exiting.");
      process.exit(1);
    }
    callback(JSON.parse(body).access_token);
  });
};

// Send message to Watson Workspace
const sendMessage = (spaceId, message) => {

  // Spaces API
  const spacesAPI = `v1/spaces/${spaceId}/messages`;

  // Photos API
  const photosAPI = `photos`;

  // Format for sending messages to Workspace
  const messageData = {
    type: "appMessage",
    version: 1.0,
    annotations: [
      {
        type: "generic",
        version: 1.0,
        color: "#1DA1F2",
        title: "Results from Twitter",
        text: message
      }
    ]
  };

  // Authenticate application and send message.
  authenticateApp( (jwt) => {

    const sendMessageOptions = {
      "method": "POST",
      "url": `${watsonWork}/${spacesAPI}`,
      "headers": {
        "Authorization": `Bearer ${jwt}`
      },
      "json": messageData
    };

    request(sendMessageOptions, (err, response, body) => {
      if(response.statusCode != 201) {
        console.log("Error posting twitter information.");
        console.log(response.statusCode);
        console.log(err);
      }
    });
  });
};

// Ensure we can parse JSON when listening to requests
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('IBM Watson Workspace app for Twitter is alive and happy!');
});

// This is callback URI that Watson Workspace will call when there's a new message created
app.post('/webhook', validateEvent, (req, res) => {

  // Check if the first part of the message is '@twitter'.
  // This lets us "listen" for the '@twitter' keyword.
  if (req.body.content.indexOf(webhookKeyword) != 0) {
    ignoreMessage(res);
    return;
  }

  // Send status back to Watson Work to confirm receipt of message
  res.status(200).end();
  
  // Id of space where outbound event originated from.
  const spaceId = req.body.spaceId;

  // Parse twitter query from message body.
  // Expected format: <keyword> <twitter query>
  const twitterQuery = req.body.content.split(' ')[1];
  console.log('Getting Twitter results: \'' + twitterQuery + '\'');

  client.get('search/tweets', {q: twitterQuery}, function(err, tweets, response) {

    // If error, send message to Watson Workspace with failure message
    if (err) {
      sendMessage(spaceId, failMessage, res);
      return ;
    }
    
    var resultCount = tweets.statuses.length;
    var messageToPost = "";
    
    // return up to 3 tweets
    var tweetCount = resultCount > 3 ? 3 : resultCount;
    
    for (var i = 0; i < tweetCount; i++) { 
      messageToPost += successMessage(tweets.statuses[i].user.screen_name, tweets.statuses[i].text, tweets.statuses[i].id_str);
    }
    
    console.log("Posting recent twitter search results back to space");
    sendMessage(spaceId, messageToPost);
    return;
  });
});

// Kickoff the main process to listen to incoming requests
app.listen(process.env.PORT || 3000, () => {
  console.log('Twitter app is listening on the port');
});
