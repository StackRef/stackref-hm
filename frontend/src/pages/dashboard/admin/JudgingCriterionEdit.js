import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Link as RouterLink } from 'react-router-dom';
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
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import LoadingScreen from 'src/components/LoadingScreen';
import GetEvents from 'src/components/stackref/GetEvents';
import GetJudgingCriteria from 'src/components/stackref/GetJudgingCriteria';
import NotFound from 'src/pages/NotFound';
import { useDispatch, useSelector } from 'src/store';
import { getOrgEvent } from 'src/slices/orgEvent';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const JudgingCriterionEditForm = Loadable(
  lazy(() => import('src/components/dashboard/admin/JudgingCriterionEditForm')),
);

const JudgingCriterionEdit = () => {
  const { eventUuid, judgingCriterionUuid } = useParams();
  const { settings } = useSettings();
  const [judgingCriterion, setJudgingCriterion] = useState();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const orgEvent = useSelector((state) => state.orgEvent);
  const dispatch = useDispatch();

  console.log(`:: JudgingCriterionEdit: ${judgingCriterionUuid}`);

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    dispatch(getOrgEvent({ user: user, eventUuid: eventUuid }));
  }, [dispatch, eventUuid, user]);

  const getJudgingCriterion = useCallback(async () => {
    console.log(':: getJudgingCriterion');
    try {
      await GetJudgingCriteria(user, eventUuid, judgingCriterionUuid)
        .then(async (data) => {
          try {
            setJudgingCriterion(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
            setLoading(false);
          } catch (error) {
            setJudgingCriterion(null);
            setLoading(false);
            throw new Error(error);
          }
        })
        .catch((error) => {
          console.error('>> GetJudgingCriteria: ', error);
          throw error;
        });
    } catch (error) {
      console.error(`>> getJudgingCriterion: ${error}`);
    }
  }, [user, eventUuid, judgingCriterionUuid]);

  useEffect(() => {
    getJudgingCriterion();
  }, [getJudgingCriterion]);

  return (
    <>
      <Helmet>
        <title>Judging Criterion | Event | Admin | StackRef</title>
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
                Judging Criterion
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
                  Judging Criterion
                  {judgingCriterion
                    ? ': ' + judgingCriterion.criterion_details.criterion_name
                    : ''}
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          {isLoading || !orgEvent.data ? (
            <LoadingScreen />
          ) : !judgingCriterion ? (
            <NotFound />
          ) : (
            <Box sx={{ mt: 3 }}>
              <JudgingCriterionEditForm judgingCriterion={judgingCriterion} />
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

export default JudgingCriterionEdit;
