import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const UserList = Loadable(
  lazy(() => import('src/components/dashboard/admin/UserList')),
);
const OrganizationInvitations = Loadable(
  lazy(() => import('src/components/dashboard/admin/OrganizationInvitations')),
);

const tabs = [
  { label: 'Users', value: 'users' },
  { label: 'Invitations', value: 'invitations' },
];

const Users = () => {
  const { settings } = useSettings();
  const { initializeOrgUsers } = useStackRef();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('users');
  const [isLoading, setLoading] = useState(true);

  console.log(':: Users');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      await initializeOrgUsers();
      setLoading(false);
    }
    initialize();
  }, [initializeOrgUsers]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Users | Admin | StackRef</title>
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
                Users
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
                <Typography color='textSecondary' variant='subtitle2'>
                  Users
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
            ) : currentTab === 'users' ? (
              <UserList />
            ) : currentTab === 'invitations' ? (
              <OrganizationInvitations />
            ) : (
              ''
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Users;
