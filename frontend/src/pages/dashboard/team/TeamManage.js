import { Suspense, lazy, useState, useEffect } from 'react';
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
import useStackRef from 'src/hooks/useStackRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamEditForm = Loadable(
  lazy(() => import('src/components/dashboard/team/TeamEditForm')),
);
const TeamMemberListTable = Loadable(
  lazy(() => import('src/components/dashboard/team/TeamMemberListTable')),
);
const NotFound = Loadable(lazy(() => import('src/pages/NotFound')));

const tabs = [
  { label: 'Details', value: 'details' },
  { label: 'Members', value: 'teamMembers' },
];

const TeamManage = () => {
  const { settings } = useSettings();
  const { activeTeam } = useStackRef();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('details');

  console.log(':: TeamManage');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Manage | Team | StackRef</title>
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
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to={'/dashboard/team/status'}
                  variant='subtitle2'
                >
                  Team
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Manage
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {!activeTeam ? (
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
                {currentTab === 'details' && <TeamEditForm />}
                {currentTab === 'teamMembers' && <TeamMemberListTable />}
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default TeamManage;
