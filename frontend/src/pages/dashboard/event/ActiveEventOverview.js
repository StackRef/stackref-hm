import { Suspense, lazy, useState, useEffect } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import gtm from 'src/lib/gtm';
import {
  Box,
  Breadcrumbs,
  Container,
  Divider,
  Grid,
  Link,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import useSettings from 'src/hooks/useSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const EventOverview = Loadable(
  lazy(() => import('src/components/dashboard/event/EventOverview')),
);
const EventActivity = Loadable(
  lazy(() => import('src/components/dashboard/event/EventActivity')),
);
const EventParticipantsList = Loadable(
  lazy(() => import('src/components/dashboard/event/EventParticipantsList')),
);
const TeamsList = Loadable(
  lazy(() => import('src/components/dashboard/event/TeamsList')),
);

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Participants', value: 'participants' },
  { label: 'Teams', value: 'teams' },
  { label: 'Activity & Results', value: 'activity' },
];

const ActiveEventOverview = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isLoading, setLoading] = useState(true);
  const { activeOrgEvent, initializeOrgEvents, initializeUserParticipants } =
    useStackRef();
  const navigate = useNavigate();

  console.log(':: ActiveEventOverview');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      await initializeOrgEvents();
      await initializeUserParticipants();
      setLoading(false);
    }
    initialize();
  }, [initializeOrgEvents, initializeUserParticipants]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Overview | Event | StackRef</title>
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
                {currentTab === 'overview' && 'Event Overview'}
                {currentTab === 'participants' && 'Event Participants'}
                {currentTab === 'teams' && 'Event Teams'}
                {currentTab === 'activity' && 'Event Activity & Results'}
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
                  Event
                  {activeOrgEvent?.event_details?.event_name
                    ? `: ${activeOrgEvent.event_details.event_name}`
                    : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <LoadingScreen />
          ) : !activeOrgEvent ? (
            navigate('/dashboard/organization/events')
          ) : (
            <>
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
              <Box sx={{ mt: 3 }}>
                {currentTab === 'overview' && <EventOverview />}
                {currentTab === 'participants' && <EventParticipantsList />}
                {currentTab === 'teams' && <TeamsList />}
                {currentTab === 'activity' && <EventActivity />}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default ActiveEventOverview;
