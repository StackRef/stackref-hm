import { Suspense, lazy, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import useStackRef from 'src/hooks/useStackRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const tabs = [
  { label: 'List', value: 'list' },
  { label: 'Calendar', value: 'calendar' },
];

const EventsList = Loadable(
  lazy(() => import('src/components/dashboard/organization/EventsList')),
);
const EventsCalendar = Loadable(
  lazy(() => import('src/components/dashboard/organization/EventsCalendar')),
);

const Events = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const { initializeUserParticipants, initializeOrgEvents } = useStackRef();
  const [isLoading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('list');

  console.log(':: Events');

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
        <title>Events | Organization | StackRef</title>
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
                Events
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
                <Typography color='textSecondary' variant='subtitle2'>
                  Events
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
          <Box sx={{ mt: 3 }}>
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
            ) : currentTab === 'list' ? (
              <EventsList />
            ) : currentTab === 'calendar' ? (
              <EventsCalendar />
            ) : (
              ''
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Events;
