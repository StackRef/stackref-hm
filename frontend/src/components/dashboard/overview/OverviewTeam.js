import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Card,
  CardContent,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import StatusIndicator from 'src/components/StatusIndicator';
import useStackRef from 'src/hooks/useStackRef';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Gravatar from 'src/icons/Gravatar';
import TeamAvatar from 'src/components/dashboard/team/TeamAvatar';
import TeamBanner from 'src/components/dashboard/team/TeamBanner';

const OverviewTeam = (props) => {
  const { fullList, ...other } = props;
  const theme = useTheme();
  const [isLoading, setLoading] = useState(true);
  const {
    activeTeam,
    initializeUserParticipants,
    initializeTeamMembers,
    teamMembers,
  } = useStackRef();

  useEffect(() => {
    async function initialize() {
      await initializeTeamMembers();
      setLoading(false);
    }
    initialize();
  }, [initializeTeamMembers]);

  useEffect(() => {
    initializeUserParticipants();
  }, [initializeUserParticipants]);

  return (
    <Card {...other}>
      <Box
        sx={{
          backgroundColor: theme.palette.primary.main,
          display: 'flex',
          px: 2,
          py: 1,
        }}
      >
        {activeTeam && teamMembers?.length > 0 ? (
          <Box sx={{ mr: 1 }}>
            <TeamAvatar
              teamUuid={activeTeam.team_uuid}
              assetUuid={activeTeam.avatar_image_uuid}
            />
          </Box>
        ) : null}
        <Box sx={{ display: 'block' }}>
          <Typography color={theme.palette.background.paper} variant='h6'>
            Current Active Team
          </Typography>
          {!isLoading && activeTeam?.team_details?.team_name ? (
            <Typography variant='body2' color='textPrimary'>
              {activeTeam.team_details.team_name}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isLoading && activeTeam?.team_uuid ? (
          <Box sx={{ display: 'flex' }}>
            <TeamBanner
              teamUuid={activeTeam.team_uuid}
              assetUuid={activeTeam.banner_image_uuid}
              height='200px'
              width='100%'
              sx={{
                maxHeight: '200px',
                mb: 2,
                overflow: 'hidden',
              }}
            />
          </Box>
        ) : null}
        {isLoading ? (
          <Skeleton sx={{ width: '100%', height: '200px' }} />
        ) : teamMembers?.length > 0 && !!!fullList ? (
          <Box sx={{ display: 'flex', justifyContent: 'left', width: '100%' }}>
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
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        teamMember.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Captain',
                        ) ? (
                          <StarsOutlinedIcon color='primary' fontSize='small' />
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
                  <Tooltip title='Go to team overview'>
                    <Link
                      component={RouterLink}
                      to={'/dashboard/team/status'}
                      sx={{
                        color: theme.palette.common.white,
                        textDecoration: 'none',
                      }}
                    >
                      +{teamMembers.length - 4}
                    </Link>
                  </Tooltip>
                </Avatar>
              ) : null}
            </AvatarGroup>
          </Box>
        ) : teamMembers?.length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'left', width: '100%' }}>
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
                      disableTypography
                      primary={
                        <Link
                          color='textPrimary'
                          display='block'
                          noWrap
                          underline='none'
                          variant='subtitle2'
                        >
                          {teamMember.first_name} {teamMember.last_name}
                        </Link>
                      }
                    />
                    {teamMember.isActive ? (
                      <StatusIndicator size='small' status='online' />
                    ) : (
                      <Typography
                        color='textSecondary'
                        noWrap
                        variant='caption'
                      >
                        {teamMember.lastActivity &&
                          formatDistanceToNowStrict(teamMember.lastActivity)}
                      </Typography>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ) : (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            <Typography sx={{ color: 'text.secondary' }}>
              Not in a current active team
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OverviewTeam;
