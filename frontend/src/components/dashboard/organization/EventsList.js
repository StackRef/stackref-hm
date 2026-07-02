import { Suspense, lazy, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const EventsListGrid = Loadable(lazy(() => import('./EventsListGrid')));
const EventsListTable = Loadable(lazy(() => import('./EventsListTable')));

const EventsList = (props) => {
  const { orgEvents } = useStackRef();
  const theme = useTheme();
  const { user } = useAuth();

  console.log(':: EventsList');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <Box sx={{ mt: 3 }}>
      {user.user_role_grants?.includes('organization_write') && (
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
      )}
      {orgEvents ? (
        <>
          <Card
            sx={{
              mb: 2,
            }}
          >
            <CardHeader
              title='Current Events'
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                py: 1,
              }}
            />
            <CardContent>
              <EventsListGrid />
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title='Upcoming / Ended Events'
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                py: 1,
              }}
            />
            <CardContent>
              <Typography
                sx={{
                  mb: 2,
                }}
              >
                Organization administrators have the ability to create new
                events or modify existing ones.
              </Typography>
              <EventsListTable />
            </CardContent>
          </Card>
        </>
      ) : (
        <Paper
          sx={{
            p: 2,
          }}
        >
          <Box>
            <Typography>No events exist for this organization</Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default EventsList;
