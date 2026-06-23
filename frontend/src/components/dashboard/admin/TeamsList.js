import { Suspense, lazy, useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import AddIcon from '@mui/icons-material/Add';
import useAuth from 'src/hooks/useAuth';
import { useDispatch, useSelector } from 'src/store';
import { getTeams } from 'src/slices/teams';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamsListTable = Loadable(lazy(() => import('./TeamsListTable')));
const NewTeamDialog = Loadable(lazy(() => import('./NewTeamDialog')));

const TeamsList = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const orgEvent = useSelector((state) => state.orgEvent);
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch();

  console.log(':: TeamsList');

  useEffect(() => {
    async function initialize() {
      try {
        dispatch(getTeams({ user: user, eventUuid: orgEvent.data.event_uuid }));
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewTeamOpen = () => {
    setNewTeamOpen(true);
  };

  const handleNewTeamClose = () => {
    setNewTeamOpen(false);
    dispatch(getTeams({ user: user, eventUuid: orgEvent.data.event_uuid }));
  };

  return (
    <>
      {user.user_role_grants?.includes('organization_write') &&
        !['Judging', 'Complete', 'Archived'].includes(
          orgEvent.data.event_status_name,
        ) && (
          <Box sx={{ m: -1 }}>
            <Button
              onClick={handleNewTeamOpen}
              color='primary'
              startIcon={<AddIcon fontSize='small' />}
              sx={{ m: 1 }}
              variant='contained'
            >
              New Team
            </Button>
            <NewTeamDialog
              orgEvent={orgEvent.data}
              handleNewTeamClose={handleNewTeamClose}
              newTeamOpen={newTeamOpen}
            />
          </Box>
        )}
      <Box sx={{ mt: 3 }}>
        <TeamsListTable />
      </Box>
    </>
  );
};

export default TeamsList;
