import { useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import StatusIndicator from 'src/components/StatusIndicator';
import useStackRef from 'src/hooks/useStackRef';
import Gravatar from 'src/icons/Gravatar';

const TeamPopover = () => {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { activeTeam, initializeTeamMembers, teamMembers } = useStackRef();

  console.log(':: TeamPopover');

  const handleOpen = () => {
    initializeTeamMembers();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title='Team'>
        <IconButton color='inherit' onClick={handleOpen} ref={anchorRef}>
          <Groups2RoundedIcon />
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorRef.current}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={open}
        PaperProps={{
          sx: {
            width: 320,
          },
        }}
      >
        <Card>
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              px: 2,
              py: 1,
            }}
          >
            {teamMembers?.length > 0 ? (
              <Gravatar
                emailAddress={
                  activeTeam?.team_details?.team_avatar ||
                  activeTeam?.team_details?.team_name
                }
                fullName={activeTeam?.team_details?.team_name}
                sx={{ mr: 1 }}
              />
            ) : null}
            <Box sx={{ display: 'block' }}>
              <Typography color={theme.palette.background.paper} variant='h6'>
                Team
              </Typography>
              {activeTeam?.team_details?.team_name ? (
                <Typography variant='body2' color='textPrimary'>
                  {activeTeam.team_details.team_name}
                </Typography>
              ) : null}
            </Box>
          </Box>
          <CardContent>
            {!teamMembers ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography sx={{ color: 'text.secondary' }}>
                  No team assigned
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {teamMembers?.map((teamMember) => {
                  return (
                    <ListItem disableGutters key={teamMember.team_member_uuid}>
                      <ListItemAvatar>
                        <Gravatar
                          emailAddress={teamMember.email_address}
                          fullName={
                            teamMember.first_name + ' ' + teamMember.last_name
                          }
                        />
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
            )}
          </CardContent>
          {!teamMembers ? null : (
            <CardActions
              sx={{
                justifyContent: 'center',
              }}
            >
              <Link
                component={RouterLink}
                to={'/dashboard/team/status'}
                sx={{ textDecoration: 'none' }}
              >
                <Button variant='contained' onClick={handleClose}>
                  Team Overview
                </Button>
              </Link>
            </CardActions>
          )}
        </Card>
      </Popover>
    </>
  );
};

export default TeamPopover;
