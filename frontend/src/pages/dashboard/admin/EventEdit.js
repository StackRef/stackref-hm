import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import NotFound from 'src/pages/NotFound';
import { useDispatch, useSelector } from 'src/store';
import { getOrgEvent } from 'src/slices/orgEvent';
import { getTeams } from 'src/slices/teams';
import { getParticipants } from 'src/slices/participants';
import { getJudgingCriteria } from 'src/slices/judgingCriteria';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const EventEditForm = Loadable(
  lazy(() => import('src/components/dashboard/admin/EventEditForm')),
);
const ParticipantListTable = Loadable(
  lazy(() => import('src/components/dashboard/admin/ParticipantListTable')),
);
const TeamsList = Loadable(
  lazy(() => import('src/components/dashboard/admin/TeamsList')),
);
const JudgingCriteriaList = Loadable(
  lazy(() => import('src/components/dashboard/admin/JudgingCriteriaList')),
);

const EventEdit = () => {
  const { eventUuid } = useParams();

  const { settings } = useSettings();
  const theme = useTheme();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('details');
  const [isLoading, setLoading] = useState(true);
  const [participantsStatus, setParticipantsStatus] = useState();
  const [judgingCriteriaStatus, setJudgingCriteriaStatus] = useState();
  const [teamsStatus, setTeamsStatus] = useState();
  const orgEvent = useSelector((state) => state.orgEvent);
  const participants = useSelector((state) => state.participants);
  const teams = useSelector((state) => state.teams);
  const judgingCriteria = useSelector((state) => state.judgingCriteria);
  const dispatch = useDispatch();

  const tabs = [
    { label: 'Details', value: 'details' },
    {
      label: 'Participants',
      value: 'participants',
      status: participantsStatus,
    },
    { label: 'Teams', value: 'teams', status: teamsStatus },
    {
      label: 'Judging Criteria',
      value: 'judging_criteria',
      status: judgingCriteriaStatus,
    },
  ];

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  useEffect(() => {
    async function initialize() {
      try {
        await Promise.all([
          dispatch(getOrgEvent({ user: user, eventUuid: eventUuid })),
          dispatch(getTeams({ user: user, eventUuid: eventUuid })),
          dispatch(getParticipants({ user: user, eventUuid: eventUuid })),
          dispatch(getJudgingCriteria({ user: user, eventUuid: eventUuid })),
        ]);
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasPlayer = participants.data.some((obj) => {
      const playerRole = obj.participant_roles?.find(
        (role) => role.participant_role_name === 'Player',
      );
      return !!playerRole;
    });

    const hasJudge = participants.data.some((obj) => {
      const judgeRole = obj.participant_roles?.find(
        (role) => role.participant_role_name === 'Judge',
      );
      return !!judgeRole;
    });

    if (!hasPlayer && !hasJudge) {
      setParticipantsStatus('No players or judges assigned');
    } else if (!hasPlayer) {
      setParticipantsStatus('No players assigned');
    } else if (!hasJudge) {
      setParticipantsStatus('No judges assigned');
    } else {
      setParticipantsStatus(null);
    }
  }, [participants]);

  useEffect(() => {
    !judgingCriteria.data.length
      ? setJudgingCriteriaStatus('No judging criteria set')
      : setJudgingCriteriaStatus(null);
  }, [judgingCriteria]);

  useEffect(() => {
    !teams.data.length
      ? setTeamsStatus('No teams assigned')
      : setTeamsStatus(null);
  }, [teams]);

  return (
    <>
      <Helmet>
        <title>StackRef | Dashboard | Admin | Events | Edit Event</title>
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
                Event
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
                  Admin
                </Typography>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard/admin/events'
                  variant='subtitle2'
                >
                  Events
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Event
                  {orgEvent.data
                    ? ': ' + orgEvent.data.event_details?.event_name
                    : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <LoadingScreen />
          ) : !orgEvent.data ? (
            <NotFound />
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
                    <Tab
                      key={tab.value}
                      label={tab.label}
                      value={tab.value}
                      icon={
                        tab.status ? (
                          <WarningAmberIcon fontSize='small' />
                        ) : null
                      }
                      iconPosition='start'
                    />
                  ))}
                </Tabs>
              </Box>
              <Divider />
              <Box sx={{ mt: 3 }}>
                {currentTab === 'details' && <EventEditForm />}
                {currentTab === 'participants' && <ParticipantListTable />}
                {currentTab === 'teams' && <TeamsList />}
                {currentTab === 'judging_criteria' && <JudgingCriteriaList />}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default EventEdit;
