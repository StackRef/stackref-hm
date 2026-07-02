import { lazy, Suspense, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '@mui/material/styles';
import useSettings from 'src/hooks/useSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoadingScreen from 'src/components/LoadingScreen';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const AWSAccount = Loadable(
  lazy(() => import('src/components/dashboard/resource/AWSAccount')),
);

const CloudAccount = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { activeTeam, initializeUserParticipants } = useStackRef();
  const [isLoading, setLoading] = useState(true);

  console.log(':: CloudAccount');

  useEffect(() => {
    async function initialize() {
      await initializeUserParticipants();
      setLoading(false);
    }
    initialize();
  }, [initializeUserParticipants]);

  return (
    <>
      <Helmet>
        <title>Cloud Account | Resources | Team | Dashboard | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          minHeight: '100%',
          py: 8,
        }}
      >
        <Container maxWidth={settings.compact ? 'xl' : false}>
          <Grid container justifyContent='space-between' spacing={3}>
            <Grid item>
              <Typography color='textPrimary' variant='h5'>
                Cloud Account
              </Typography>
              <Breadcrumbs
                aria-label='breadcrumb'
                separator={<ChevronRightIcon fontSize='small' />}
                sx={{ mt: 1 }}
              >
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard'
                  variant='subtitle2'
                >
                  Dashboard
                </Link>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard/team/status'
                  variant='subtitle2'
                >
                  Team
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Resources
                </Typography>
                <Typography color='textSecondary' variant='subtitle2'>
                  Cloud Account
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          <Divider />
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <Box sx={{ mt: 3 }}>
              {!activeTeam ? (
                <Paper
                  sx={{
                    p: 2,
                  }}
                >
                  <Box>
                    <Typography>
                      You are not yet part of an active team
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      mb: 1,
                    }}
                  >
                    <Typography
                      color='textPrimary'
                      gutterBottom
                      variant='body1'
                    >
                      Use this page to access the AWS account provisioned for
                      your team.
                      <br /> <br />
                      Only Team Captains are able to assign cloud accounts to
                      your team, if the Event you are participating in has cloud
                      accounts enabled. Only Event administrators are able to
                      enable cloud account usage on a per-Event basis.
                      <br />
                      <br />
                      Note that not all services are available in your
                      provisioned AWS account, though the most common are (EC2,
                      S3, etc.). EC2 resources are limited to certain types. See
                      our{' '}
                      <Link
                        href='https://docs.example.com/team/aws-account'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        documentation{' '}
                      </Link>
                      for more information on what resources are permitted.
                      <br />
                      <br />
                      Some resources will use up your Team's StackCash. If your
                      Team lacks sufficient StackCash to deploy these resources,
                      they may fail to deploy or stop.
                    </Typography>
                  </Box>
                  <AWSAccount />
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

export default CloudAccount;
