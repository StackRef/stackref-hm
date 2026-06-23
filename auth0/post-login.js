const axios = require("axios");
const Sentry = require("@sentry/node");
const SentryTracing = require("@sentry/tracing");

//const srApiUrl = "https://33t7jq9x85.execute-api.us-east-1.amazonaws.com";
const srApiUrl = "https://api.acme.example.com";
//const srApiUrl = "https://demo.example.com/api";
const srAuthUrl = "https://auth.acme.example.com";
//const srAuthUrl = "https://example.us.auth0.com";
const appVersion = "0.9.1";
const namespace = 'https://acme.example.com';

Sentry.init({
  dsn: "https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
  tracesSampleRate: 1.0,
});

async function SendSlackNotification(event) {
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

async function RegisterUser(beToken, event, api) {
  console.log(':: RegisterUser');
  const dtm = new Date();
  try {
    await axios(
      {
        url: `${srApiUrl}/userRegistration`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sr-application': `SR/Auth0-onExecutePostLogin/${appVersion}`,
          'Authorization': `Bearer ${beToken}`
        },
        data: { event }
      }
    )
    .then(function (response) {
      if (response.data && response.data.user_uuid) {
        console.log(`:: onExecutePostLogin: response data: ${JSON.stringify(response.data)}`);
        api.idToken.setCustomClaim(`${namespace}/sr-user-uuid`, response.data.user_uuid);
        api.accessToken.setCustomClaim(`${namespace}/sr-user-uuid`, response.data.user_uuid);
        api.user.setAppMetadata("sr-user-uuid", response.data.user_uuid);
      }
      api.user.setAppMetadata("sr-update-app", "onExecutePostLogin");
      api.user.setAppMetadata("sr-update-dtm", dtm.toTimeString());
      SendSlackNotification(event);
    })
    .catch(function (err) {
      throw err;
    });
  } catch (err) {
    console.error(`>> onExecutePostLogin: ${err}`);
    Sentry.captureException(err);
  }
}

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  console.log(':: onExecutePostLogin');

  api.user.setAppMetadata("sr-axios-error", null);
  api.user.setAppMetadata("sr-function-error", null);
  let beToken;

  // Authenticate ourselves with our own Back-End API, to pass to getUser
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
    console.error(`>> onExecutePostLogin: tokenOptions: ${err}`);
    Sentry.captureException(err);
  }

  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }

  // Grab getUser from SR API to get metadata we'll add as custom values to the claim
  try {
    if (!event.user.email_verified) {
      console.log(':: User email is not yet verified');
      api.redirect.sendUserTo(`${event.transaction.redirect_uri}?email_verified=false`);
    } else {
      await axios(
        {
          url: `${srApiUrl}/getUser`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sr-application': `SR/Auth0-onExecutePostLogin/${appVersion}`,
            'Authorization': `Bearer ${beToken}`
          },
          data: { "user": { "auth_provider_id": event.user.user_id } }
        }
      )
      .then(async function (response) {
        const dtm = new Date();
        if (!response.data) { // User may have logged in with social account and is not in SR DB yet
          await RegisterUser(beToken, event, api);
        } else {
          if (event.authorization) {
            if (response.data.user_uuid) {
              api.idToken.setCustomClaim(`${namespace}/sr-user-uuid`, response.data.user_uuid);
              api.accessToken.setCustomClaim(`${namespace}/sr-user-uuid`, response.data.user_uuid);
              api.user.setAppMetadata("sr-user-uuid", response.data.user_uuid);
            }
            if (response.data.organization_uuid) {
              api.idToken.setCustomClaim(`${namespace}/sr-organization-uuid`, response.data.organization_uuid);
              api.accessToken.setCustomClaim(`${namespace}/sr-organization-uuid`, response.data.organization_uuid);
              api.user.setAppMetadata("sr-organization-uuid", response.data.organization_uuid);
            }
          }
          api.user.setAppMetadata("sr-update-app", "onExecutePostLogin");
          api.user.setAppMetadata("sr-update-dtm", dtm.toTimeString());
        } 
      })
      .catch(function (err) {
        api.user.setAppMetadata("sr-axios-error", err.toString());
        throw err;
      });
    }
  } catch (err) {
    console.error(`>> onExecutePostLogin: ${err}`);
    api.user.setAppMetadata("sr-function-error", err.toString());
    Sentry.captureException(err);
  }
};

/**
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
  console.log(':: onContinuePostLogin')
  if (!event.user.email_verified)
    api.access.deny("Please check your email and verify your email address before logging in");
};
