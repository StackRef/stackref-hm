const axios = require("axios");
const Sentry = require("@sentry/node");
const SentryTracing = require("@sentry/tracing");

//const srApiUrl = "https://e0wwt34gr4.execute-api.us-east-1.amazonaws.com/userRegistration";
const srApiUrl = "https://api.acme.example.com";
//const srApiUrl = "https://demo.example.com/api";
const srAuthUrl = "https://auth.acme.example.com";
//const srAuthUrl = "https://example.us.auth0.com";
const appVersion = "0.6.1";

Sentry.init({
  dsn: "https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
  tracesSampleRate: 1.0,
});

async function SendSlackNotification (event) {
  const { IncomingWebhook } = require("@slack/webhook");
  const webhook = new IncomingWebhook(event.secrets.SLACK_WEBHOOK_URL);

  const text = `New User: ${event.user.email}`;
  const channel = '#new_registrations_dev';

  try {
    webhook.send({ text, channel });
  } catch (err) {
    Sentry.captureException(err);
  }
};

/*
 * Handler that will be called during the execution of a PostUserRegistration flow.
 *
 * @param {Event} event - Details about newly created user.
*/
exports.onExecutePostUserRegistration = async (event) => {
  console.log(':: Starting onExecutePostUserRegistration');
  const namespace = 'https://acme.example.com';

  let beToken;

  // Authenticate ourselves with our own Back-End API, to pass to our API routes
  try {
    const tokenOptions = {
      method: 'POST',
      url: `${srAuthUrl}/oauth/token`,
      headers: { 'content-type': 'application/json' },
      data: {
        grant_type: 'client_credentials',
        client_id: event.secrets.SR_AUTH0_CLIENT_ID,
        client_secret: event.secrets.SR_AUTH0_CLIENT_SECRET,
        audience: 'https://be.acme.example.com'
      }
    };
    const res = await axios.request(tokenOptions);
    beToken = res.data.access_token;
  } catch (err) {
    console.error(`>> onExecutePostUserRegistration: tokenOptions: ${err}`);
    Sentry.captureException(err);
  }

  try {
    await axios(
      {
        url: `${srApiUrl}/userRegistration`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sr-application': `SR/Auth0-onExecutePostUserRegistration/${appVersion}`,
          'Authorization': `Bearer ${beToken}`
        },
        data: { event }
      }
    )
    .then(function (response) {
      if (response.data)
        console.log(`:: onExecutePostUserRegistration: response data: ${JSON.stringify(response.data)}`);
        SendSlackNotification(event);
    })
    .catch(function (err) {
      throw err;
    });
  } catch (err) {
    console.error(`>> onExecutePostUserRegistration: ${err}`);
    Sentry.captureException(err);
  }
};
