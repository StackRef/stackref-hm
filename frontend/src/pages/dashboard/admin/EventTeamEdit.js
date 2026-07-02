import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink } from 'react-router-dom';
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
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import GetTeams from 'src/components/stackref/GetTeams';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamEditForm = Loadable(
  lazy(() => import('src/components/dashboard/event/TeamEditForm')),
);
const TeamMemberListTable = Loadable(
  lazy(() => import('src/components/dashboard/event/TeamMemberListTable')),
);
const NotFound = Loadable(lazy(() => import('src/pages/NotFound')));

const tabs = [
  { label: 'Details', value: 'details' },
  { label: 'Members', value: 'teamMembers' },
];

const EventTeamEdit = () => {
  const { eventUuid, teamUuid } = useParams();
  const { settings } = useSettings();
  const [team, setTeam] = useState();
  const { initializeParticipants, initializeTeams } = useStackRef();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('details');
  const [isLoading, setLoading] = useState(true);

  console.log(`:: EventTeamEdit: ${teamUuid}`);

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    initializeParticipants(eventUuid);
    initializeTeams(eventUuid);
  }, [eventUuid, initializeParticipants, initializeTeams, teamUuid]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  const getTeam = async () => {
    console.log(':: getTeam');
    try {
      await GetTeams(user, eventUuid, teamUuid)
        .then((data) => {
          try {
            setTeam(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
            setLoading(false);
          } catch (error) {
            setTeam(null);
            setLoading(false);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getTeam: ${error}`);
    }
  };

  useEffect(() => {
    async function initialize() {
      await getTeam();
      setLoading(false);
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>Edit | Team | StackRef</title>
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
                Team
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
                <Typography color='textSecondary' variant='subtitle2'>
                  Admin
                </Typography>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to={'/dashboard/admin/events'}
                  variant='subtitle2'
                >
                  Events
                </Link>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to={'/dashboard/admin/events/' + eventUuid}
                  variant='subtitle2'
                >
                  Event
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Team{team ? ': ' + team.team_details.team_name : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <LoadingScreen />
          ) : !team ? (
            <NotFound title='Team Not Found' />
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
                {currentTab === 'details' && (
                  <TeamEditForm team={team} setTeam={setTeam} />
                )}
                {currentTab === 'teamMembers' && (
                  <TeamMemberListTable team={team} eventUuid={eventUuid} />
                )}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default EventTeamEdit;
