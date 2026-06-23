import { useCallback, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import gtm from 'src/lib/gtm';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetTeams from 'src/components/stackref/GetTeams';
import TeamExternalLinkListTable from './TeamExternalLinkListTable';
import JudgingCriteriaListTable from './JudgingCriteriaListTable';
import TeamFeedback from './TeamFeedback';
import TeamMemberListTable from './TeamMemberListTable';
import TeamCashTransactionChart from './TeamCashTransactionChart';
import LoadingScreen from 'src/components/LoadingScreen';
import TeamVideos from 'src/components/dashboard/team/TeamVideos';
import TeamAnalysis from 'src/components/dashboard/team/TeamAnalysis';
import TeamAvatar from 'src/components/dashboard/team/TeamAvatar';
import TeamBanner from 'src/components/dashboard/team/TeamBanner';

const TeamJudging = (props) => {
  const { teamUuid, ...other } = props;
  const { user } = useAuth();
  const { initializeParticipants, participants } = useStackRef();
  const [isLoading, setLoading] = useState(true);
  const [team, setTeam] = useState();
  const { activeOrgEvent } = useStackRef();
  const [judge, setJudge] = useState();

  console.log(`:: TeamJudging: ${teamUuid}`);

  useEffect(() => {
    setJudge(participants?.find((p) => p.user_uuid === user.user_uuid));
  }, [participants, user]);

  const videoLinks = team?.team_external_links?.filter(
    (link) => link.external_link_type_name === 'Video',
  );

  const getTeam = useCallback(
    async (teamUuid) => {
      console.log(`:: getTeam: ${teamUuid}`);

      try {
        await GetTeams(user, activeOrgEvent?.event_uuid, teamUuid)
          .then((data) => {
            try {
              if (data?.[0]) setTeam(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> getTeam: ${err}`);
        setTeam(null);
      }
    },
    [activeOrgEvent, user],
  );

  useEffect(() => {
    async function initialize() {
      await initializeParticipants(activeOrgEvent?.event_uuid);
      await getTeam(teamUuid);
      setLoading(false);
    }
    initialize();
  }, [activeOrgEvent, getTeam, initializeParticipants, teamUuid, user]);

  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography color='textPrimary' gutterBottom variant='h5'>
              {team?.team_details?.team_name}
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
            }}
          >
            <TeamBanner
              teamUuid={team?.team_uuid}
              assetUuid={team?.banner_image_uuid}
              height='200px'
              width='100%'
              sx={{
                maxHeight: '200px',
                mb: 2,
                overflow: 'hidden',
              }}
            />
          </Box>
          <Grid
            alignItems='flex-start'
            container
            justifyContent='center'
            spacing={2}
            sx={{
              mb: 2,
            }}
          >
            <Grid
              item
              sx={{
                display: 'inline-flex',
              }}
            >
              <TeamMemberListTable team={team} />
            </Grid>
            <Grid
              item
              sx={{
                display: 'inline-flex',
              }}
            >
              <TeamCashTransactionChart team={team} />
            </Grid>
          </Grid>
          {videoLinks ? (
            <Grid item xs={12} sm={8}>
              <TeamVideos videoLinks={videoLinks} />
            </Grid>
          ) : null}
          <Grid
            alignItems='center'
            container
            item
            justifyContent='center'
            sx={{
              mb: 2,
            }}
          >
            <Typography
              color='primary'
              sx={{
                textAlign: 'center',
                width: '100%',
              }}
            >
              This team has provided the following links, to be included in
              judging and assessment for this event.
            </Typography>
            <TeamExternalLinkListTable team={team} />
          </Grid>
          <TeamAnalysis team={team} sx={{ my: 2 }} />
          <Grid
            alignItems='center'
            container
            item
            justifyContent='center'
            sx={{
              mb: 2,
            }}
          >
            <JudgingCriteriaListTable team={team} judge={judge} />
          </Grid>
          <Grid container item alignItems='center' justifyContent='center'>
            <Typography
              color='primary'
              sx={{
                textAlign: 'center',
                width: '100%',
              }}
            >
              Provide optional, anonymous feedback to the team.
            </Typography>
            <TeamFeedback team={team} />
          </Grid>
        </>
      )}
    </>
  );
};

export default TeamJudging;
