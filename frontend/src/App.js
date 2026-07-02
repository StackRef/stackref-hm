import { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { Box, Grid, ThemeProvider, Typography } from '@mui/material';
import './i18n';
import GlobalStyles from './components/GlobalStyles';
import RTL from './components/RTL';
//import SettingsDrawer from './components/SettingsDrawer';
import SplashScreen from './components/SplashScreen';
import { gaConfig, gtmConfig } from './config';
import useAuth from './hooks/useAuth';
import useStackRef from './hooks/useStackRef';
import useScrollReset from './hooks/useScrollReset';
import useSettings from './hooks/useSettings';
import googleAnalytics from './lib/ga';
import gtm from './lib/gtm';
import routes from './routes';
import { createMyTheme } from './theme';
import { ErrorBoundary } from '@sentry/react';

const App = () => {
  const { settings } = useSettings();
  const auth = useAuth();
  const { activeTeamMember, participant } = useStackRef();
  const content = useRoutes(routes(auth, participant, activeTeamMember));
  useScrollReset();

  console.log(':: App');

  useEffect(() => {
    gtm.initialize(gtmConfig);
    googleAnalytics.initialize(gaConfig);
  }, []);

  const theme = createMyTheme({
    direction: settings.direction,
    responsiveFontSizes: settings.responsiveFontSizes,
    roundedCorners: settings.roundedCorners,
    theme: settings.theme,
  });

  return (
    <ThemeProvider theme={theme}>
      <RTL direction={settings.direction}>
        <GlobalStyles />
        <ErrorBoundary
          fallback={({ eventId, error, componentStack, resetError }) => (
            <Box
              sx={{
                bgcolor: theme.palette.background.default,
                minHeight: '100%',
              }}
            >
              <Grid
                container
                spacing={0}
                direction='column'
                alignItems='center'
                justifyContent='center'
                style={{ minHeight: '100vh' }}
              >
                <Typography
                  color='error'
                  sx={{
                    textAlign: 'center',
                  }}
                >
                  Error {eventId} occurred:
                  <br />
                  <br />
                  {error.toString()}
                  <br />
                  <br />
                </Typography>
                <Typography
                  color='textSecondary'
                  sx={{
                    m: 5,
                  }}
                >
                  {componentStack}
                </Typography>
              </Grid>
            </Box>
          )}
        >
          {auth.isInitialized ? content : <SplashScreen />}
        </ErrorBoundary>
      </RTL>
    </ThemeProvider>
  );
};

export default App;
