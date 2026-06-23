import { useEffect, useState } from 'react';
import { Box, CircularProgress, Grid } from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import TeamScoresList from './TeamScoresList';
import TeamFeedback from './TeamFeedback';
import { useDispatch } from 'src/store';
import { getTeamScoreItems } from 'src/slices/teamScoreItems';
import TeamAnalysis from './TeamAnalysis';

const TeamScores = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const { activeTeam } = useStackRef();
  const dispatch = useDispatch();

  console.log(':: TeamScores');

  useEffect(() => {
    async function initialize() {
      if (activeTeam)
        dispatch(
          getTeamScoreItems({ user: user, teamUuid: activeTeam.team_uuid }),
        );
      setLoading(false);
    }
    initialize();
  }, [activeTeam, dispatch, user]);

  return (
    <>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      ></Box>
      {isLoading ? (
        <Grid
          container
          spacing={0}
          direction='column'
          alignItems='center'
          justifyContent='center'
          sx={{ height: '100vh', minHeight: '100vh' }}
        >
          <CircularProgress />
        </Grid>
      ) : (
        <>
          <TeamScoresList sx={{ mt: 3 }} />
          <TeamFeedback sx={{ mt: 2 }} />
          <TeamAnalysis sx={{ mt: 2 }} />
        </>
      )}
    </>
  );
};

export default TeamScores;
