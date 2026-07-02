import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import GetTeamMembers from 'src/components/stackref/GetTeamMembers';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { styled, useTheme } from '@mui/material/styles';
import Gravatar from 'src/icons/Gravatar';
import TeamAvatar from 'src/components/dashboard/team/TeamAvatar';
import TeamBanner from 'src/components/dashboard/team/TeamBanner';
import { handleRequestToJoin } from './teamJoin';
import { handleRequestToLeave } from './teamLeave';

const TeamInfoCard = (props) => {
  const {
    badge,
    drawerOpen,
    totalScore,
    team,
    activeOrgEvent,
    fullList,
    setJudgingTeam,
    setDrawerOpen,
    setDrawerContent,
    ...other
  } = props;
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [thisCardOpen, setThisCardOpen] = useState(false);
  const theme = useTheme();
  const { activeTeam, activeTeamMember, participant } = useStackRef();

  const teamDetails = team.team_details;

  const TeamCard = styled(Box)(({ theme }) => ({
    overflow: 'visible',
    position: 'relative',
  }));

  const BadgeIcon = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: theme.spacing(-0.5),
    top: theme.spacing(-1),
  }));

  const ActiveIcon = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: theme.spacing(-0.5),
    bottom: theme.spacing(-1),
  }));

  const TotalScore = styled(Grid)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
  }));

  const getTeamMembers = useCallback(async () => {
    console.log(':: getTeamMembers');
    setLoading(true);
    try {
      if (team?.team_uuid) {
        await GetTeamMembers(user, team.team_uuid)
          .then(async (data) => {
            try {
              setTeamMembers(data);
            } catch (err) {
              setTeamMembers(null);
              throw err;
            }
            setLoading(false);
          })
          .catch((err) => {
            throw err;
          });
      }
    } catch (err) {
      console.error(`>> getTeamMembers: ${err}`);
    }
  }, [user, team]);

  useEffect(() => {
    getTeamMembers();
  }, [getTeamMembers]);

  const DrawerContent = useMemo(
    () => (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          height: '100%',
          width: 350,
        }}
      >
        <Box sx={{ width: '100%', mt: 10, mx: 2 }}>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Box
              sx={{
                p: 1,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                borderRadius: '50%',
              }}
            >
              {teamDetails && isLoading ? (
                <Skeleton variant='circular' height={60} width={60} />
              ) : (
                <TeamAvatar
                  teamUuid={team.team_uuid}
                  assetUuid={team.avatar_image_uuid}
                  withBorder
                  sx={{ height: 60, width: 60 }}
                  height={60}
                  width={60}
                />
              )}
            </Box>
          </Box>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Typography variant='h5' sx={{ textAlign: 'center' }}>
              {teamDetails && isLoading ? (
                <Skeleton width={150} />
              ) : (
                teamDetails.team_name
              )}
            </Typography>
          </Box>
          {!activeOrgEvent || !participant || isLoading ? null : (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <LoadingButton
                disabled={
                  isSubmitting ||
                  (activeTeam && activeTeam?.team_uuid !== team?.team_uuid)
                }
                loading={isSubmitting}
                variant='outlined'
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    if (
                      activeTeam &&
                      activeTeamMember &&
                      activeTeam?.team_uuid === team?.team_uuid
                    ) {
                      await handleRequestToLeave({
                        user: user,
                        team: team,
                        teamMember: activeTeamMember,
                      });
                    } else {
                      await handleRequestToJoin({
                        user: user,
                        participant: participant,
                        team: team,
                      });
                    }
                  } catch (error) {
                    console.error(`>> handleRequestToJoin/Leave: ${error}`);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {!activeTeam ? 'Request to Join' : null}
                {activeTeam && activeTeam?.team_uuid !== team?.team_uuid
                  ? 'Already in a Team'
                  : null}
                {activeTeam &&
                activeTeamMember &&
                activeTeam?.team_uuid === team?.team_uuid
                  ? 'Leave Team'
                  : null}
              </LoadingButton>
            </Box>
          )}
          <Divider sx={{ mr: 4, mt: 2 }} />
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Chip color='primary' label='Team Mission' />
            </Box>
            <Typography
              sx={{
                fontStyle: teamDetails?.team_mission ? 'inherit' : 'italic',
                mt: 1,
              }}
            >
              {teamDetails?.team_mission
                ? teamDetails.team_mission
                : 'Nothing added'}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Chip color='primary' label='Team Members' />
            </Box>
            {isLoading ? (
              <Skeleton width={150} />
            ) : teamMembers?.length < 1 ? (
              <Typography sx={{ fontStyle: 'italic' }}>
                Team is empty
              </Typography>
            ) : (
              <List disablePadding>
                {teamMembers?.map((teamMember) => {
                  return (
                    <ListItem disableGutters key={teamMember.team_member_uuid}>
                      <ListItemAvatar>
                        {teamMember.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Captain',
                        ) ? (
                          <Tooltip title='Captain'>
                            <Badge
                              overlap='circular'
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                              }}
                              badgeContent={
                                <StarsOutlinedIcon
                                  color='primary'
                                  fontSize='small'
                                />
                              }
                            >
                              <Gravatar
                                emailAddress={teamMember.email_address}
                                fullName={`${teamMember.first_name} ${teamMember.last_name}`}
                              />
                            </Badge>
                          </Tooltip>
                        ) : teamMember.team_member_roles?.some(
                            (d) => d.team_member_role_name === 'Player',
                          ) ? (
                          <Tooltip title='Player'>
                            <Badge
                              overlap='circular'
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                              }}
                              badgeContent={
                                <AccountCircleOutlinedIcon
                                  color='primary'
                                  fontSize='small'
                                />
                              }
                            >
                              <Gravatar
                                emailAddress={teamMember.email_address}
                                fullName={`${teamMember.first_name} ${teamMember.last_name}`}
                              />
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Gravatar
                            emailAddress={teamMember.email_address}
                            fullName={`${teamMember.first_name} ${teamMember.last_name}`}
                          />
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          teamMember.first_name + ' ' + teamMember.last_name
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Box>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeOrgEvent,
      activeTeam,
      activeTeamMember,
      isLoading,
      isSubmitting,
      participant,
      team,
      teamDetails,
      teamMembers,
      user,
    ],
  );

  useEffect(() => {
    if (drawerOpen && thisCardOpen && setDrawerContent) {
      setDrawerContent(DrawerContent);
    }
    if (!drawerOpen && setDrawerContent && setThisCardOpen) {
      setThisCardOpen(false);
      setDrawerContent(null);
    }
  }, [
    DrawerContent,
    activeOrgEvent,
    activeTeam,
    drawerOpen,
    participant,
    setDrawerContent,
    team,
    teamMembers,
    thisCardOpen,
  ]);

  return (
    <TeamCard {...other}>
      {badge === 'top_scorer' && (
        <Tooltip title='Top Scorer'>
          <BadgeIcon>
            <EmojiEventsRoundedIcon color='warning' />
          </BadgeIcon>
        </Tooltip>
      )}
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {teamDetails && isLoading ? (
                <Skeleton
                  variant='circular'
                  height={40}
                  width={40}
                  sx={{ mr: 1 }}
                />
              ) : (
                <TeamAvatar
                  teamUuid={team.team_uuid}
                  assetUuid={team.avatar_image_uuid}
                  sx={{ mr: 1 }}
                />
              )}
              {teamDetails && isLoading ? (
                <Skeleton width={150} />
              ) : (
                teamDetails.team_name
              )}
            </Box>
          }
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            py: 1,
          }}
        />
        <CardContent>
          <Box
            sx={{
              width: '100%',
            }}
          >
            {team.team_uuid === activeTeam?.team_uuid ? (
              <Tooltip title='Current Team'>
                <ActiveIcon>
                  <CheckCircleRoundedIcon color='success' />
                </ActiveIcon>
              </Tooltip>
            ) : null}
            <TeamBanner
              teamUuid={team.team_uuid}
              assetUuid={team.banner_image_uuid}
              height='200px'
              width='100%'
              sx={{
                maxHeight: '200px',
                mb: 2,
                overflow: 'hidden',
              }}
            />
          </Box>
          {totalScore ? (
            <TotalScore
              container
              alignItems='center'
              justifyContent='center'
              sx={{
                mb: 2,
              }}
            >
              <Typography>
                {isLoading ? (
                  <Skeleton width={250} />
                ) : (
                  `Total Score: ${totalScore}`
                )}
              </Typography>
            </TotalScore>
          ) : null}
          {setJudgingTeam ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                width: '100%',
              }}
            >
              <Button
                sx={{ backgroundColor: theme.palette.background.paper }}
                onClick={() => setJudgingTeam(team.team_uuid)}
              >
                Judge Team
              </Button>
            </Box>
          ) : !badge ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                width: '100%',
              }}
            >
              <Button
                sx={{ backgroundColor: theme.palette.background.paper }}
                onClick={(event) => {
                  setDrawerContent(DrawerContent);
                  setThisCardOpen(true);
                  setDrawerOpen(true);
                  event.stopPropagation();
                }}
              >
                View Details
              </Button>
            </Box>
          ) : null}
          {isLoading ? (
            <Skeleton sx={{ width: '100%', height: '100px' }} />
          ) : teamMembers?.length > 0 && !!!fullList ? (
            <Box
              sx={{ display: 'flex', justifyContent: 'left', width: '100%' }}
            >
              <AvatarGroup>
                {teamMembers?.slice(0, 4).map((teamMember) => {
                  return (
                    <Tooltip
                      key={teamMember.team_member_uuid}
                      title={
                        teamMember.first_name +
                        ' ' +
                        teamMember.last_name +
                        (teamMember.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Captain',
                        )
                          ? ' (Captain)'
                          : '')
                      }
                    >
                      <Badge
                        overlap='circular'
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        badgeContent={
                          teamMember.team_member_roles?.some(
                            (d) => d.team_member_role_name === 'Captain',
                          ) ? (
                            <StarsOutlinedIcon
                              color='primary'
                              fontSize='small'
                            />
                          ) : null
                        }
                      >
                        <Gravatar
                          emailAddress={teamMember.email_address}
                          fullName={
                            teamMember.first_name + ' ' + teamMember.last_name
                          }
                        />
                      </Badge>
                    </Tooltip>
                  );
                })}
                {teamMembers?.length > 4 ? (
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      ':hover': {
                        backgroundColor: 'black',
                      },
                    }}
                  >
                    +{teamMembers.length - 4}
                  </Avatar>
                ) : null}
              </AvatarGroup>
            </Box>
          ) : teamMembers?.length > 0 ? (
            <Box
              sx={{ display: 'flex', justifyContent: 'left', width: '100%' }}
            >
              <List disablePadding>
                {teamMembers?.map((teamMember) => {
                  return (
                    <ListItem disableGutters key={teamMember.team_member_uuid}>
                      <ListItemAvatar>
                        {teamMember.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Captain',
                        ) ? (
                          <Tooltip title='Captain'>
                            <Badge
                              overlap='circular'
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                              }}
                              badgeContent={
                                <StarsOutlinedIcon
                                  color='primary'
                                  fontSize='small'
                                />
                              }
                            >
                              <Gravatar
                                emailAddress={teamMember.email_address}
                                fullName={`${teamMember.first_name} ${teamMember.last_name}`}
                              />
                            </Badge>
                          </Tooltip>
                        ) : teamMember.team_member_roles?.some(
                            (d) => d.team_member_role_name === 'Player',
                          ) ? (
                          <Tooltip title='Player'>
                            <Badge
                              overlap='circular'
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                              }}
                              badgeContent={
                                <AccountCircleOutlinedIcon
                                  color='primary'
                                  fontSize='small'
                                />
                              }
                            >
                              <Gravatar
                                emailAddress={teamMember.email_address}
                                fullName={`${teamMember.first_name} ${teamMember.last_name}`}
                              />
                            </Badge>
                          </Tooltip>
                        ) : null}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          teamMember.first_name + ' ' + teamMember.last_name
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ) : (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              <Typography sx={{ fontStyle: 'italic' }}>
                Team is empty
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </TeamCard>
  );
};

export default TeamInfoCard;
