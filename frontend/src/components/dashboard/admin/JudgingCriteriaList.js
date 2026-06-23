import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import AddIcon from '@mui/icons-material/Add';
import useAuth from 'src/hooks/useAuth';
import { useDispatch, useSelector } from 'src/store';
import { getJudgingCriteria } from 'src/slices/judgingCriteria';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const JudgingCriteriaListTable = Loadable(
  lazy(() => import('./JudgingCriteriaListTable')),
);

const JudgingCriteriaList = (props) => {
  const { ...other } = props;
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgEvent = useSelector((state) => state.orgEvent);
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch();

  console.log(':: JudgingCriteriaList');

  useEffect(() => {
    async function initialize() {
      try {
        dispatch(
          getJudgingCriteria({
            user: user,
            eventUuid: orgEvent.data.event_uuid,
          }),
        );
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {user.user_role_grants?.includes('event_write') &&
        !['Complete', 'Archived'].includes(orgEvent.data.event_status_name) && (
          <Box sx={{ m: -1 }}>
            <Button
              onClick={() =>
                navigate(
                  `/dashboard/admin/events/${orgEvent.data.event_uuid}/judging_criterion/create`,
                )
              }
              color='primary'
              startIcon={<AddIcon fontSize='small' />}
              sx={{ m: 1 }}
              variant='contained'
            >
              New Criterion
            </Button>
          </Box>
        )}
      <Box
        sx={{
          mt: 2,
        }}
      >
        <Typography color='text.primary'>
          Team scores will be based on points assigned by event judges on the
          criteria specified below. The value represents the maximum points a
          judge may assign to a team for that criterion.
        </Typography>
      </Box>
      <Box sx={{ mt: 3 }}>
        <JudgingCriteriaListTable />
      </Box>
    </>
  );
};

export default JudgingCriteriaList;
