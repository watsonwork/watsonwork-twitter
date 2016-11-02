# Twitter App Sample for IBM Watson Workspace

[![Build Status](https://travis-ci.org/watsonwork/watsonwork-twitter.svg)](https://travis-ci.org/watsonwork/watsonwork-twitter)

App built with node.js to listen to messages posted in a space in IBM Watson Workspace and returns back recent tweets about a given topic. 

This app will listen for `@twitter <keyword/hashtag/@user/phrase>` and give you a sense of what people are saying about that in Twitter.

The Watson Work platform provides **spaces** for people to exchange
**messages** in conversations. This app shows how to listen to a conversation
and receive messages on a Webhook endpoint, then send response messages back
to the conversation. It also demonstrates how to authenticate an application
and obtain the OAuth token needed to make Watson Work API calls.

## Deploy the app
Assuming you just want to take this code and get it running before hacking it, the first step is to get it deployed to a live on a server so that IBM Watson Workspace validates it's up and working before pushing messages to the app. 

To facilitate things, you can click the button below and it'll get it going to Bluemix very easily, however this is **NOT** required. Feel free to deploy on any server you want.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/watsonwork/watsonwork-twitter)

*Note*: you can run this code locally, but then you would need to change the webhook code to get the URL of the callback. See Appendix for instructions.

Once the code is live, make note of the URL (e.g. http://mysuperawesomeurl.mybluemix.net) as you'll need this later.

## How to register the Twitter App with IBM Watson Workspace
Now let's register the app to get some API keys and get things going. First, we need several API keys from Twitter. You can get them by going go to: [https://apps.twitter.com](https://apps.twitter.com) . In a couple of steps you can super easily register a "bot". That will then give you a few keys that you will also need to put in your environment variables as such:

In Terminal (or any Terminal emulator such as Git Bash or Cygwin):
```
export TWITTER_CONSUMER_KEY=...
export TWITTER_CONSUMER_SECRET=...
export TWITTER_ACCESS_TOKEN_KEY=....
export TWITTER_ACCESS_TOKEN_SECRET=...
```

Second, let's register the app with IBM Watson Workspace and get some keys!

1. Go to [the developer apps page](https://workspace.ibm.com/developer/apps)
2. On the left, enter the `App Name` and the `Description of App`
3. Click on `Add an outbound webhook`
4. Give the webhook a name (e.g. "listen for messages") and check the `message-created` webhook. This is how we'll listen to messages in a space
5. In the callback URL, specify the URL for your app. This code assumes that the webhook listener is at `https://yoururl/webhook` so don't forget to add `/webhook` to the end of the URL (if you don't know where the app will be deployed, use a sample URL for now, like `https://twitter.acme.com/webhook` and you can modify that later)
6. Click on `Register app`
7. This will give you the App ID, App secret and webhook secret. You *need to save* these to environment variables called `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, and `TWITTER_WEBHOOK_SECRET` respectively

At this point the webhook is not enabled since the system has not been able to verify it's up and running. While the webhook is probably running on Bluemix, it doesn't have the variables set

## Configure your app

Now that we have the API keys, set them as environment variables. If you are using Bluemix, you can set them up following these steps:

1. Go to [the Bluemix console](https://console.ng.bluemix.net/dashboard/applications/) and click on your app
2. Go to Runtime -> Environment Variables
3. Define the 7 variables from above: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_WEBHOOK_SECRET`, `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN_KEY` and `TWITTER_ACCESS_TOKEN_SECRET`, provide the right values and save them.
4. Stop and start the app so the values take effect.

You are almost there!!! 

## Enable the webhook

1. Assuming all environment variables are set (see above), go back to the [IBM Watson Work Services apps page](https://workspace.ibm.com/developer/apps) and click on the pencil icon to edit your app
2. Check the box to enable your webhook
3. Save your changes by clicking on "Edit app"

This now does an HTTP POST verification call to ensure your webhook is setup properly. This will also ensure that all your variables and code are good to go. If so, the webhook is now enabled and it's ready to be used! How easy was that!?!

## Add the Twitter app to a space to test
We are almost there! Now we need to add the app to spaces that we want to listen for messages, and where the app will post messages to.

1. Head out to [IBM Watson Workspace](https://workspace.ibm.com) and go to your favorite space
2. Go into the space settings
3. Click on `Apps` to go the apps menu
4. Click on your app to add it to the space
5. Type in `@twitter #watsonworkspace` and the app should respond with the 3 latest tweets that mention that hashtag

Have fun!!

## Appendix: How to Start Twitter app locally
1. Install Node.js 6+.
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the code
4. Set the environment variables as per above.
5. Run `npm start`
6. The server will now run on localhost:3000.

You can use curl to submit a query and test it (or just deploy to Bluemix and test it there!) to simulate a call from Workspace to your webhook.  Or check out the [Greeter](https://github.com/watsonwork/watsonwork-greeter) sample for further instructions on how to run locally.

## What API does the app use?

The app uses the [Watson Work OAuth API]
(https://workspace.ibm.com/developer/docs) to authenticate and get an
OAuth token. It implements a Webhook endpoint according to the
[Watson Work Webhook API](https://workspace.ibm.com/developer/docs) to
listen to conversations and receive messages. Finally, it uses the
[Watson Work Spaces API] (https://workspace.ibm.com/developer/docs) to send
back greeting messages.

## How can I contribute?

Pull requests welcome!

## License and Dependencies
Licensed under Apache 2.0 (see LICENSE)

Depends on:
* body-parser
* express
* request
* twitter
* request