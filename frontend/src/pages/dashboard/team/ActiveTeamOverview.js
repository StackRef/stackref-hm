import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Breadcrumbs,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import useSettings from 'src/hooks/useSettings';
import useStackRef from 'src/hooks/useStackRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamOverview = Loadable(
  lazy(() => import('src/components/dashboard/team/TeamOverview')),
);
const TeamScores = Loadable(
  lazy(() => import('src/components/dashboard/team/TeamScores')),
);

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Scores', value: 'scores' },
];

const ActiveTeamOverview = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [currentTab, setCurrentTab] = useState('overview');
  const { activeTeam, initializeUserParticipants } = useStackRef();
  const [isLoading, setLoading] = useState(true);

  console.log(':: ActiveTeamOverview');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      await initializeUserParticipants();
      setLoading(false);
    }
    initialize();
  }, [initializeUserParticipants]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Overview | Team | StackRef</title>
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
                Overview
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
                <Typography color='textPrimary' variant='subtitle2'>
                  Team
                </Typography>
                <Typography color='textPrimary' variant='subtitle2'>
                  Status
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Tabs
              indicatorColor='primary'
              onChange={handleTabsChange}
              scrollButtons='auto'
              textColor='primary'
              value={currentTab}
              variant='scrollable'
            >
              {tabs.map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>
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
              ) : currentTab === 'overview' ? (
                <TeamOverview />
              ) : currentTab === 'scores' ? (
                <TeamScores />
              ) : null}
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

export default ActiveTeamOverview;
