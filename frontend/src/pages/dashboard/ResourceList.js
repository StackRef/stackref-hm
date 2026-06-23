import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import useWebSocket from 'src/hooks/useWebSocket';
import useAuth from 'src/hooks/useAuth';
import useSettings from 'src/hooks/useSettings';
import useStackRef from 'src/hooks/useStackRef';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const ResourceListTable = Loadable(
  lazy(() => import('src/components/dashboard/resource/ResourceListTable')),
);

const ResourceList = () => {
  const isMountedRef = useIsMountedRef();
  const { settings } = useSettings();
  const { initializeTeamResources, teamResources } = useStackRef();
  const theme = useTheme();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);

  console.log(':: ResourceList');

  const UpdateResource = (objIndex) => {
    const updatedResources = [...resources];
    setResources(updatedResources);
  };

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      await initializeTeamResources(user.settings.active_event_uuid);
      setLoading(false);
    }
    initialize();
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard: Resource List | StackRef</title>
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
                Resource List
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
                  to='/dashboard'
                  variant='subtitle2'
                >
                  Management
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Resources
                </Typography>
              </Breadcrumbs>
            </Grid>
            <Grid item>
              {user.user_role_grants &&
              user.user_role_grants.includes('resources_write') ? (
                <Box sx={{ m: -1 }}>
                  <Button
                    color='primary'
                    component={RouterLink}
                    startIcon={<AddIcon fontSize='small' />}
                    sx={{ m: 1 }}
                    to='/dashboard/resources/new'
                    variant='contained'
                  >
                    New Resource
                  </Button>
                </Box>
              ) : (
                ''
              )}
            </Grid>
          </Grid>
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
            ) : (
              <ResourceListTable />
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default ResourceList;
