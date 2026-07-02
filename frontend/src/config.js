//import * as packageInfo from '../../package.json';

export const amplifyConfig = {
  aws_project_region: import.meta.env.REACT_APP_AWS_PROJECT_REGION,
  aws_cognito_identity_pool_id:
    import.meta.env.REACT_APP_AWS_COGNITO_IDENTITY_POOL_ID,
  aws_cognito_region: import.meta.env.REACT_APP_AWS_COGNITO_REGION,
  aws_user_pools_id: import.meta.env.REACT_APP_AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id:
    import.meta.env.REACT_APP_AWS_USER_POOLS_WEB_CLIENT_ID,
};

export const auth0Config = {
  clientId: import.meta.env.REACT_APP_AUTH0_CLIENT_ID,
  domain: import.meta.env.REACT_APP_AUTH0_DOMAIN,
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  useRefreshTokensFallback: true,
  useCookiesForTransactions: true,
};

export const stripeConfig = {
  publicKey: import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY,
  pricingTable: import.meta.env.REACT_APP_STRIPE_PRICING_TABLE,
};

export const gtmConfig = {
  containerId: import.meta.env.REACT_APP_GTM_CONTAINER_ID,
};

export const gaConfig = {
  measurementId: import.meta.env.REACT_APP_GA_MEASUREMENT_ID,
};

export const stackrefConfig = {
  uiVersion: import.meta.env.REACT_APP_VERSION,
  uiEnvironment: import.meta.env.REACT_APP_ENVIRONMENT,
  wsBase: import.meta.env.REACT_APP_SR_WS_BASE,
  wsEnabled: import.meta.env.REACT_APP_SR_WS_ENABLED,
  apiUrl: import.meta.env.REACT_APP_SR_API_URL,
};

export const muiProConfig = {
  licenseKey: import.meta.env.REACT_APP_MUI_PRO_LICENSE_KEY,
};

export const sentryConfig = {
  sentryEnabled: import.meta.env.REACT_APP_SENTRY_ENABLED,
  sentryDebug: import.meta.env.REACT_APP_SENTRY_DEBUG,
  sentryDsn: import.meta.env.REACT_APP_SENTRY_DSN,
};

export const zoomConfig = {
  sdkKey: import.meta.env.REACT_APP_ZOOM_SDK_KEY,
  sdkSecret: import.meta.env.REACT_APP_ZOOM_SDK_SECRET,
};
