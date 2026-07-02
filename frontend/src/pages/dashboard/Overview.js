import { lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useAuth from 'src/hooks/useAuth';
import { Box, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useSettings from 'src/hooks/useSettings';
import gtm from 'src/lib/gtm';
import LoadingCard from 'src/components/LoadingCard';

console.log(':: Overview');

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingCard />}>
    <Component {...props} />
  </Suspense>
);

console.log(':: Overview');

const OverviewActiveEvent = Loadable(
  lazy(() => import('src/components/dashboard/overview/OverviewActiveEvent')),
);
const OverviewNotifications = Loadable(
  lazy(() => import('src/components/dashboard/overview/OverviewNotifications')),
);
const OverviewTeam = Loadable(
  lazy(() => import('src/components/dashboard/overview/OverviewTeam')),
);
const OverviewTeamBankBalance = Loadable(
  lazy(
    () => import('src/components/dashboard/overview/OverviewTeamBankBalance'),
  ),
);
const OrganizationStackCash = Loadable(
  lazy(() => import('src/components/dashboard/admin/OrganizationStackCash')),
);
const OverviewNextSteps = Loadable(
  lazy(() => import('src/components/dashboard/overview/OverviewNextSteps')),
);

const Overview = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Overview | Dashboard | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          minHeight: '100%',
          py: 8,
        }}
      >
        <Container maxWidth={settings.compact ? 'xl' : false}>
          <Grid container spacing={3}>
            <Grid
              alignItems='center'
              container
              justifyContent='space-between'
              spacing={3}
              item
              xs={12}
            >
              <Grid item>
                <Typography color='textSecondary' variant='overline'>
                  Overview
                </Typography>
                <Typography color='textPrimary' variant='h5'>
                  Greetings{user.first_name ? ', ' + user.first_name : ''}
                </Typography>
                <Typography color='textSecondary' variant='subtitle2'>
                  Here&apos;s what&apos;s been happening with your organization
                  lately
                </Typography>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                m: 2,
              }}
            >
              <OverviewNextSteps />
            </Grid>
            <Grid
              container
              spacing={2}
              sx={{
                m: 2,
              }}
            >
              <Grid item md={4} xs={12}>
                <OverviewNotifications />
              </Grid>
              <Grid item md={4} xs={12}>
                <OverviewActiveEvent />
              </Grid>
              <Grid item md={4} xs={12}>
                <OverviewTeam />
              </Grid>
            </Grid>
            <Grid
              container
              spacing={2}
              sx={{
                mx: 2,
              }}
            >
              {user.user_role_grants?.includes('organization_write') && (
                <Grid item md={6} xs={12}>
                  <OrganizationStackCash />
                </Grid>
              )}
              <Grid item md={6} xs={12}>
                <OverviewTeamBankBalance />
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Overview;
