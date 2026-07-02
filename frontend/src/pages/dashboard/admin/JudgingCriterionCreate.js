import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import useAuth from 'src/hooks/useAuth';
import { useDispatch, useSelector } from 'src/store';
import { getOrgEvent } from 'src/slices/orgEvent';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const JudgingCriterionCreateForm = Loadable(
  lazy(
    () => import('src/components/dashboard/admin/JudgingCriterionCreateForm'),
  ),
);

const JudgingCriterionCreate = () => {
  const { eventUuid } = useParams();
  const { settings } = useSettings();
  const { user } = useAuth();
  const theme = useTheme();
  const orgEvent = useSelector((state) => state.orgEvent);
  const dispatch = useDispatch();
  const [isLoading, setLoading] = useState(true);

  console.log(':: JudgingCriterionCreate');

  useEffect(() => {
    async function initialize() {
      try {
        dispatch(getOrgEvent({ user: user, eventUuid: eventUuid }));
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
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>New Judging Criterion | Events | Admin | StackRef</title>
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
                Create New Judging Criterion
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
                  Admin
                </Link>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard/admin/events'
                  variant='subtitle2'
                >
                  Events
                </Link>
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to={`/dashboard/admin/events/${eventUuid}`}
                  variant='subtitle2'
                >
                  Event
                  {orgEvent.data
                    ? ': ' + orgEvent.data.event_details?.event_name
                    : ''}
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Create Judging Criterion
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <JudgingCriterionCreateForm eventUuid={eventUuid} />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default JudgingCriterionCreate;
