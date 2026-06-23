import './wdyr';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'nprogress/nprogress.css';
import './stackref/stylesheet.css';
import 'react-toastify/dist/ReactToastify.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { SettingsProvider } from 'src/contexts/SettingsContext';
import { StackRefProvider } from 'src/contexts/StackRefContext';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFnsV3';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { AuthProvider } from './contexts/Auth0Context';
import { muiProConfig, sentryConfig, stackrefConfig } from 'src/config';

import * as Sentry from '@sentry/react';
import { CaptureConsole } from '@sentry/integrations';

import App from './App';

import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';
import store from './store';

import { LicenseInfo } from '@mui/x-license-pro';

// Disable console logging for production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.debug = () => {};
}

LicenseInfo.setLicenseKey(muiProConfig.licenseKey);

if (sentryConfig.sentryEnabled) {
  console.log(':: Sentry enabled');
  Sentry.init({
    debug: sentryConfig.sentryDebug,
    dsn: sentryConfig.sentryDsn,
    tunnel: '/sentry',
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
      new CaptureConsole({
        levels: ['error'],
      }),
    ],
    tracesSampleRate: 1.0,
    release: stackrefConfig.uiVersion,
    environment: stackrefConfig.uiEnvironment,
    maxBreadcrumbs: 50,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

const container = document.getElementById('root');
const root = createRoot(container);
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

// NOTE: StrictMode is disabled to stop useEffect from executing twice in development mode. Re-enable before deploying!
root.render(
  <StrictMode>
    <HelmetProvider>
      <ReduxProvider store={store}>
        <StyledEngineProvider injectFirst>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <SettingsProvider>
              <BrowserRouter>
                <AuthProvider>
                  <StackRefProvider>
                    <App />
                  </StackRefProvider>
                </AuthProvider>
              </BrowserRouter>
            </SettingsProvider>
          </LocalizationProvider>
        </StyledEngineProvider>
      </ReduxProvider>
    </HelmetProvider>
  </StrictMode>,
);

// If you want to enable client cache, register instead.
serviceWorker.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
