import { Suspense, lazy, useState, useEffect } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import gtm from 'src/lib/gtm';
import {
  Box,
  Breadcrumbs,
  Container,
  Grid,
  Link,
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

const EventLeaderBoard = Loadable(
  lazy(() => import('src/components/dashboard/event/EventLeaderBoard')),
);
const EventTimeline = Loadable(
  lazy(() => import('src/components/dashboard/event/EventTimeline')),
);

const LeaderBoard = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [isLoading, setLoading] = useState(true);
  const { activeOrgEvent, initializeOrgEvents, initializeUserParticipants } =
    useStackRef();
  const navigate = useNavigate();

  console.log(':: LeaderBoard');

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

  return (
    <>
      <Helmet>
        <title>Leaderboard | Event | StackRef</title>
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
                Leaderboard
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
              <Box sx={{ my: 3 }}>
                <EventTimeline />
              </Box>
              <Box>
                <EventLeaderBoard />
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default LeaderBoard;
