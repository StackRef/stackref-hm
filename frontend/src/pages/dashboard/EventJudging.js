import { Suspense, lazy, useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Breadcrumbs,
  Container,
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

const EventOverview = Loadable(
  lazy(() => import('src/components/dashboard/event/EventOverview')),
);
const TeamsList = Loadable(
  lazy(() => import('src/components/dashboard/event/TeamsList')),
);
const EventParticipantsList = Loadable(
  lazy(() => import('src/components/dashboard/event/EventParticipantsList')),
);

const EventJudging = () => {
  const { settings } = useSettings();
  const { activeOrgEvent } = useStackRef();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(true);
  const [currentMainTab, setCurrentMainTab] = useState('overview');
  const [judgingTeam, setJudgingTeam] = useState(null);
  const navigate = useNavigate();

  console.log(':: EventJudging');

  const mainTabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Participants', value: 'participants' },
    { label: 'Teams', value: 'teams' },
  ];

  useEffect(() => {
    async function initialize() {
      if (activeOrgEvent) {
        setLoading(false);
      } else {
        navigate('/dashboard/organization/events');
      }
    }
    initialize();
  }, [activeOrgEvent, navigate]);

  const handleMainTabsChange = (event, value) => {
    setJudgingTeam(null);
    setCurrentMainTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Judging | StackRef</title>
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
                {currentMainTab === 'overview' && 'Event Judging - Overview'}
                {currentMainTab === 'participants' &&
                  'Event Judging - Participants'}
                {currentMainTab === 'teams' && 'Event Judging - Teams'}
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
                  Judging
                  {activeOrgEvent?.event_details?.event_name
                    ? `: ${activeOrgEvent.event_details.event_name}`
                    : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                <Tabs
                  indicatorColor='primary'
                  onChange={handleMainTabsChange}
                  scrollButtons='auto'
                  textColor='primary'
                  value={currentMainTab}
                  variant='scrollable'
                >
                  {mainTabs.map((tab) => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} />
                  ))}
                </Tabs>
              </Box>
              <Box sx={{ mt: 3 }}>
                {currentMainTab === 'teams' ? (
                  <TeamsList
                    judgingTeam={judgingTeam}
                    setJudgingTeam={setJudgingTeam}
                  />
                ) : currentMainTab === 'participants' ? (
                  <EventParticipantsList />
                ) : (
                  <EventOverview />
                )}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default EventJudging;
