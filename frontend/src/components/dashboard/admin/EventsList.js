import { Suspense, lazy, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Link } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import gtm from 'src/lib/gtm';
import AddIcon from '@mui/icons-material/Add';

import useAuth from 'src/hooks/useAuth';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const EventsListTable = Loadable(lazy(() => import('./EventsListTable')));

const EventsList = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();

  console.log(':: EventsList');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      {user.user_role_grants?.includes('organization_write') && (
        <>
          <Box sx={{ m: 1 }}>
            <Link
              component={RouterLink}
              sx={{
                textDecoration: 'none',
              }}
              to='/dashboard/admin/events/create'
            >
              <Button
                color='primary'
                startIcon={<AddIcon fontSize='small' />}
                variant='contained'
              >
                New Event
              </Button>
            </Link>
          </Box>
        </>
      )}
      <Box sx={{ mt: 3 }}>
        <EventsListTable />
      </Box>
    </>
  );
};

export default EventsList;
