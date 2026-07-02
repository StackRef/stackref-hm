import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetTeamScoreItems from 'src/components/stackref/GetTeamScoreItems';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import TeamInfoCard from './TeamInfoCard';
import GetEventActivity from 'src/components/stackref/GetEventActivity';

const EventLeaderBoard = (props) => {
  const { orgEvent, eventTeams, ...other } = props;
  const { user } = useAuth();
  const { activeOrgEvent, eventActivity, initializeEventActivity, teams } =
    useStackRef();
  const theme = useTheme();
  const [teamRankings, setTeamRankings] = useState([]);
  const [calculatingRanking, setCalculatingRaking] = useState(true);
  const [isLoading, setLoading] = useState(true);
  const [thisEventActivity, setThisEventActivity] = useState(null);

  console.log(':: EventLeaderBoard');

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );
  const thisEventTeams = useMemo(
    () => (eventTeams ? eventTeams : teams),
    [eventTeams, teams],
  );

  const getEventActivity = async () => {
    console.log(`:: getEventActivity: ${thisEvent.event_uuid}`);
    try {
      await GetEventActivity(user, thisEvent.event_uuid)
        .then((data) => {
          try {
            setThisEventActivity(data);
          } catch (error) {
            setThisEventActivity(null);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getEventActivity: ${error}`);
    }
  };

  const getTeamScoreItems = async (teamUuid) => {
    console.log(`:: getTeamScoreItems: ${teamUuid}`);

    try {
      return await GetTeamScoreItems(user, teamUuid)
        .then((data) => {
          try {
            if (data) {
              return data;
            } else {
              return null;
            }
          } catch (err) {
            throw new Error(err);
          }
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.error(`>> getTeamScoreItems: ${err}`);
    }
  };

  const calcTeamTotalScore = async (teamUuid) => {
    const teamScoreItems = await getTeamScoreItems(teamUuid);
    console.log(':: calcTeamTotalScore');
    return teamScoreItems?.team_score_total || 0;
  };

  const getTeamRankings = useCallback(async () => {
    if (!isLoading && thisEventTeams) {
      thisEventTeams.forEach(async (row, index) => {
        let teamTotalScore = await calcTeamTotalScore(row.team_uuid);
        setTeamRankings((prevState) => [
          ...prevState.filter((i) => i.teamUuid !== row.team_uuid),
          { teamUuid: row.team_uuid, totalScore: teamTotalScore },
        ]);
      });
      setCalculatingRaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, thisEventTeams]);

  const topScoringTeam = thisEventTeams?.find((team) => {
    const teamScore = teamRankings?.find(
      (i) => i.teamUuid === team.team_uuid,
    )?.totalScore;
    return teamScore === Math.max(...teamRankings?.map((o) => o.totalScore));
  });

  useEffect(() => {
    getTeamRankings();
  }, [getTeamRankings]);

  useEffect(() => {
    async function initialize() {
      try {
        if (orgEvent) {
          await initializeEventActivity();
        } else {
          await getEventActivity();
        }
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
    if (!orgEvent) {
      setThisEventActivity(eventActivity);
    }
  }, [eventActivity, orgEvent]);

  function getOrdinalSuffix(num) {
    if (num % 100 >= 11 && num % 100 <= 13) {
      return num + 'th';
    }
    switch (num % 10) {
      case 1:
        return num + 'st';
      case 2:
        return num + 'nd';
      case 3:
        return num + 'rd';
      default:
        return num + 'th';
    }
  }

  return (
    <>
      <Box
        width='100%'
        sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
      >
        {topScoringTeam &&
        teamRankings?.find((i) => i.teamUuid === topScoringTeam.team_uuid)
          ?.totalScore ? (
          <Box width={300} sx={{ mb: 2 }}>
            <TeamInfoCard
              team={topScoringTeam}
              badge={'top_scorer'}
              totalScore={
                teamRankings?.find(
                  (i) => i.teamUuid === topScoringTeam?.team_uuid,
                )?.totalScore || '0'
              }
            />
          </Box>
        ) : null}
      </Box>
      <Card {...other}>
        <CardHeader
          title='Leaderboard'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            py: 1,
          }}
        />
        <CardContent>
          <TableContainer>
            <Table aria-labelledby='tableTitle' size='small'>
              <TableHead
                sx={{
                  backgroundColor: theme.palette.background.tableHead,
                }}
              >
                <TableRow sx={{ borderBottom: 'none' }}>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Place
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Team
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Score
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calculatingRanking ? (
                  <TableRow>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ) : (
                  teamRankings
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((ranking, index) => {
                      const row = thisEventTeams?.find(
                        (team) => team.team_uuid === ranking.teamUuid,
                      );
                      if (!row) return null;
                      const totalScore =
                        teamRankings?.find((i) => i.teamUuid === row.team_uuid)
                          ?.totalScore || '0';
                      return (
                        <TableRow key={row.team_uuid}>
                          <TableCell>
                            <Box sx={{ display: 'flex' }}>
                              {index === 0 && totalScore !== '0' ? (
                                <EmojiEventsRoundedIcon
                                  color='warning'
                                  fontSize='small'
                                  sx={{ mr: 1 }}
                                />
                              ) : null}
                              {totalScore === '0'
                                ? ' '
                                : getOrdinalSuffix(index + 1)}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              alignItems: 'center',
                              display: 'flex',
                            }}
                          >
                            {row.team_details?.team_name || 'Unnamed Team'}
                          </TableCell>
                          <TableCell>{totalScore}</TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default EventLeaderBoard;
