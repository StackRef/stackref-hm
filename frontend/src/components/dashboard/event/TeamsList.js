import { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddIcon from '@mui/icons-material/Add';
import LoadingScreen from 'src/components/LoadingScreen';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamsListGrid = Loadable(lazy(() => import('./TeamsListGrid')));
const TeamJudging = Loadable(
  lazy(() => import('src/components/dashboard/judging/TeamJudging')),
);
const NewTeamDialog = Loadable(
  lazy(() => import('src/components/dashboard/admin/NewTeamDialog')),
);

const TeamsList = (props) => {
  const { judgingTeam, setJudgingTeam, orgEvent, ...other } = props;
  const { activeOrgEvent, activeTeam, initializeTeams, participant, teams } =
    useStackRef();
  const [isLoading, setLoading] = useState(true);
  const [newTeamOpen, setNewTeamOpen] = useState(false);

  console.log(':: TeamsList');

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  const handleNewTeamOpen = () => {
    setNewTeamOpen(true);
  };

  const handleNewTeamClose = () => {
    setNewTeamOpen(false);
    initializeTeams(thisEvent.event_uuid);
  };

  useEffect(() => {
    async function initialize() {
      if (thisEvent) {
        await initializeTeams(thisEvent.event_uuid);
        setLoading(false);
      }
    }
    initialize();
  }, [thisEvent, initializeTeams]);

  return (
    <Box sx={{ mt: 3 }}>
      {isLoading && (
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
      )}
      {!isLoading &&
        !activeTeam &&
        activeOrgEvent?.event_uuid === thisEvent.event_uuid &&
        activeOrgEvent?.event_team_form_mode_id === 34 && // TODO: Do not hardcode
        participant?.participant_roles?.some(
          (role) =>
            role.participant_role_name === 'Manager' ||
            role.participant_role_name === 'Player',
        ) && (
          <Box sx={{ m: 1 }}>
            <Button
              color='primary'
              startIcon={<AddIcon fontSize='small' />}
              onClick={handleNewTeamOpen}
              variant='contained'
            >
              Create New Team
            </Button>
            <NewTeamDialog
              orgEvent={activeOrgEvent}
              teamFormMode={34}
              handleNewTeamClose={handleNewTeamClose}
              newTeamOpen={newTeamOpen}
            />
          </Box>
        )}
      {!isLoading && teams?.length < 1 ? (
        <Paper
          sx={{
            p: 2,
          }}
        >
          <Box>
            <Typography>
              No teams {orgEvent ? 'were created' : 'have been created yet'}
            </Typography>
          </Box>
        </Paper>
      ) : !isLoading && judgingTeam ? (
        <>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => setJudgingTeam(null)}
          >
            Back to Teams List
          </Button>
          <TeamJudging teamUuid={judgingTeam} />
        </>
      ) : !isLoading ? (
        <TeamsListGrid
          setJudgingTeam={setJudgingTeam}
          activeOrgEvent={activeOrgEvent}
        />
      ) : null}
    </Box>
  );
};

export default TeamsList;
