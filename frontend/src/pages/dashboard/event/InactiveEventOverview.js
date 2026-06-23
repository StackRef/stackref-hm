import { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import gtm from 'src/lib/gtm';
import {
  Box,
  Breadcrumbs,
  CircularProgress,
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
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetEvents from 'src/components/stackref/GetEvents';

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

const InactiveEventOverview = () => {
  const { eventUuid } = useParams();
  const { settings } = useSettings();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isLoading, setLoading] = useState(true);
  const { initializeOrgEvents, initializeUserParticipants } = useStackRef();
  const [orgEvent, setOrgEvent] = useState();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  const getOrgEvent = useCallback(
    async (eventUuid) => {
      console.log(`:: getOrgEvent: ${eventUuid}`);
      try {
        await GetEvents(user, eventUuid)
          .then((data) => {
            try {
              setOrgEvent(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
              setLoading(false);
            } catch (error) {
              setOrgEvent(null);
              setLoading(false);
            }
          })
          .catch((error) => {
            console.error('>> GetEvents: ', error);
            throw new Error(error);
          });
      } catch (error) {
        console.error(`>> getOrgEvent: ${error}`);
      }
    },
    [user],
  );

  useEffect(() => {
    async function initialize() {
      await initializeOrgEvents();
      await initializeUserParticipants();
    }
    initialize();
  }, [initializeOrgEvents, initializeUserParticipants]);

  useEffect(() => {
    getOrgEvent(eventUuid);
  }, [getOrgEvent, eventUuid]);

  console.log(':: InactiveEventOverview');

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
                  Organization
                </Typography>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard/organization/events'
                  variant='subtitle2'
                >
                  Events
                </Link>
                <Typography color='textPrimary' variant='subtitle2'>
                  Event
                  {orgEvent?.event_details?.event_name
                    ? `: ${orgEvent.event_details.event_name}`
                    : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <LoadingScreen />
          ) : !orgEvent ? (
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
                {currentTab === 'overview' && (
                  <EventOverview orgEvent={orgEvent} />
                )}
                {currentTab === 'participants' && (
                  <EventParticipantsList orgEvent={orgEvent} />
                )}
                {currentTab === 'teams' && <TeamsList orgEvent={orgEvent} />}
                {currentTab === 'activity' && (
                  <EventActivity orgEvent={orgEvent} />
                )}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default InactiveEventOverview;
