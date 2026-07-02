import { Suspense, lazy, useState, useEffect } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import gtm from 'src/lib/gtm';
import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import useSettings from 'src/hooks/useSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import NotFound from 'src/pages/NotFound';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const EventJudgingStatus = Loadable(
  lazy(() => import('src/components/dashboard/event/EventJudgingStatus')),
);

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Participants', value: 'participants' },
  { label: 'Teams & Results', value: 'teams' },
];

const EventManage = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isLoading, setLoading] = useState(true);
  const {
    activeOrgEvent,
    initializeJudgingCriteria,
    initializeParticipants,
    initializeTeams,
    initializeUserParticipants,
  } = useStackRef();

  console.log(':: EventManage');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      await initializeParticipants();
      await initializeUserParticipants();
      await initializeTeams();
      await initializeJudgingCriteria();
      setLoading(false);
    }
    initialize();
  }, [
    initializeJudgingCriteria,
    initializeParticipants,
    initializeTeams,
    initializeUserParticipants,
  ]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Manage | Event | StackRef</title>
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
                Manage Event
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
                  to='/dashboard/event'
                  variant='subtitle2'
                >
                  Event
                  {activeOrgEvent?.event_details?.event_name
                    ? `: ${activeOrgEvent.event_details.event_name}`
                    : ''}
                </Link>
                <Typography color='textPrimary' variant='subtitle2'>
                  Manage
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <Grid
              container
              spacing={0}
              direction='column'
              alignItems='center'
              justifyContent='center'
              style={{ minHeight: '100vh' }}
            >
              <CircularProgress />
            </Grid>
          ) : !activeOrgEvent ? (
            <NotFound />
          ) : (
            <>
              <Box sx={{ mt: 3 }}>
                <EventJudgingStatus />
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default EventManage;
