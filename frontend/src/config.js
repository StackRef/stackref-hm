//import * as packageInfo from '../../package.json';

export const amplifyConfig = {
  aws_project_region: process.env.REACT_APP_AWS_PROJECT_REGION,
  aws_cognito_identity_pool_id:
    process.env.REACT_APP_AWS_COGNITO_IDENTITY_POOL_ID,
  aws_cognito_region: process.env.REACT_APP_AWS_COGNITO_REGION,
  aws_user_pools_id: process.env.REACT_APP_AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id:
    process.env.REACT_APP_AWS_USER_POOLS_WEB_CLIENT_ID,
};

export const auth0Config = {
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  useRefreshTokensFallback: true,
  useCookiesForTransactions: true,
};

export const stripeConfig = {
  publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
  pricingTable: process.env.REACT_APP_STRIPE_PRICING_TABLE,
};

export const gtmConfig = {
  containerId: process.env.REACT_APP_GTM_CONTAINER_ID,
};

export const gaConfig = {
  measurementId: process.env.REACT_APP_GA_MEASUREMENT_ID,
};

export const stackrefConfig = {
  uiVersion: process.env.REACT_APP_VERSION,
  uiEnvironment: process.env.REACT_APP_ENVIRONMENT,
  wsBase: process.env.REACT_APP_SR_WS_BASE,
  wsEnabled: process.env.REACT_APP_SR_WS_ENABLED,
  apiUrl: process.env.REACT_APP_SR_API_URL,
};

export const muiProConfig = {
  licenseKey: process.env.REACT_APP_MUI_PRO_LICENSE_KEY,
};

export const sentryConfig = {
  sentryEnabled: process.env.REACT_APP_SENTRY_ENABLED,
  sentryDebug: process.env.REACT_APP_SENTRY_DEBUG,
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,
};

export const zoomConfig = {
  sdkKey: process.env.REACT_APP_ZOOM_SDK_KEY,
  sdkSecret: process.env.REACT_APP_ZOOM_SDK_SECRET,
};
