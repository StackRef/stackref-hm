import { lazy, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import useSpotify from 'src/hooks/useSpotify';
import useSettings from 'src/hooks/useSettings';
import TeamExternalLinkList from './TeamExternalLinkList';
import TeamOverviewScoreChart from './TeamOverviewScoreChart';
import { useDispatch } from 'src/store';
import { getTeamScoreItems } from 'src/slices/teamScoreItems';
import OverviewTeam from 'src/components/dashboard/overview/OverviewTeam';
import OverviewTeamBankBalance from 'src/components/dashboard/overview/OverviewTeamBankBalance';
import TeamCodeCommitInfo from './TeamCodeCommitInfo';
import LoadingScreen from 'src/components/LoadingScreen';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';

const TeamVideos = lazy(() => import('./TeamVideos'));
const TeamSpotify = lazy(() => import('./TeamSpotify'));

const TeamOverview = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const { settings, saveSettings } = useSettings();
  const theme = useTheme();
  const { initializeJudgingCriteria, judgingCriteria } = useStackRef();
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { activeOrgEvent, activeTeam } = useStackRef();
  const { setSpotifyInToolbar, spotifyLinks, spotifyInToolbar } = useSpotify();

  console.log(':: TeamOverview');

  const handleSettingsChange = (field, value) => {
    saveSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleMinimize = () => {
    setSpotifyInToolbar(true);
    handleSettingsChange('spotifyInToolbar', true);
  };

  const eventTotalPoints = useMemo(() => {
    let totalPoints = 0;
    judgingCriteria?.forEach((judgingCriterion) => {
      totalPoints = totalPoints + judgingCriterion.criterion_weight * 10;
    });
    return totalPoints;
  }, [judgingCriteria]);

  useEffect(() => {
    async function initialize() {
      if (activeTeam)
        dispatch(
          getTeamScoreItems({ user: user, teamUuid: activeTeam.team_uuid }),
        );
      if (activeOrgEvent)
        await initializeJudgingCriteria(activeOrgEvent.event_uuid);
      setLoading(false);
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const videoLinks = activeTeam?.team_external_links?.filter(
    (link) => link.external_link_type_name === 'Video',
  );

  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <Grid
            alignItems='center'
            container
            justifyContent='center'
            spacing={2}
          >
            <Grid item>
              <OverviewTeam fullList />
            </Grid>
            {videoLinks && videoLinks.length > 0 ? (
              <Grid item xs={12} sm={8}>
                <TeamVideos videoLinks={videoLinks} />
              </Grid>
            ) : null}
            {!spotifyInToolbar && spotifyLinks?.length > 0 ? (
              <Grid item>
                <Card>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      display: 'flex',
                      px: 2,
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: 'block', width: '100%' }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                        width='100%'
                      >
                        <Typography
                          color={theme.palette.background.paper}
                          variant='h6'
                        >
                          Team Playlist
                        </Typography>
                        <Tooltip title='Move to toolbar'>
                          <IconButton
                            color={theme.palette.background.paper}
                            onClick={handleMinimize}
                          >
                            <ArrowOutwardRoundedIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                  <CardContent>
                    {spotifyLinks?.length < 1 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          width: '100%',
                        }}
                      >
                        <Typography sx={{ color: 'text.secondary' }}>
                          No team playlists added
                        </Typography>
                      </Box>
                    ) : (
                      <TeamSpotify spotifyLinks={spotifyLinks} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
            <Grid item>
              <TeamOverviewScoreChart eventTotalPoints={eventTotalPoints} />
            </Grid>
            <Grid item>
              <OverviewTeamBankBalance
                sx={{ maxWidth: { xs: '380px', sm: '100%' } }}
              />
            </Grid>
          </Grid>
          <TeamCodeCommitInfo
            sx={{
              mt: 2,
            }}
          />
          <TeamExternalLinkList />
        </>
      )}
    </>
  );
};

export default TeamOverview;
