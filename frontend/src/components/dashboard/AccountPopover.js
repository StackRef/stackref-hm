import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useTheme } from '@mui/material/styles';

const AccountPopover = () => {
  const anchorRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      handleClose();
      await logout();
      navigate('/');
    } catch (err) {
      console.error(`>> handleLogout: ${err}`);
      toast.error('Unable to logout', { containerId: 'results' });
    }
  };

  return (
    <>
      <Tooltip title='Profile'>
        <Box
          component={ButtonBase}
          onClick={handleOpen}
          ref={anchorRef}
          sx={{
            alignItems: 'center',
            display: 'flex',
          }}
        >
          <Avatar
            src={user.avatar}
            sx={{
              height: 32,
              width: 32,
            }}
          />
        </Box>
      </Tooltip>
      <Popover
        anchorEl={anchorRef.current}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        keepMounted
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            sx: {
              width: 240,
            },
          },
        }}
      >
        <Card>
          <CardHeader
            title={user.first_name + ' ' + user.last_name}
            subheader={
              user.job_title ? (
                <Typography variant='body2' color='textPrimary'>
                  {user.job_title}
                </Typography>
              ) : null
            }
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              py: 1,
            }}
          />
          <CardContent>
            <MenuItem component={RouterLink} to='/dashboard/account'>
              <ListItemIcon>
                <PersonRoundedIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography color='textPrimary' variant='subtitle2'>
                    Profile
                  </Typography>
                }
              />
            </MenuItem>
          </CardContent>
          <CardActions>
            <Button
              color='primary'
              fullWidth
              onClick={handleLogout}
              variant='outlined'
            >
              Logout
            </Button>
          </CardActions>
        </Card>
      </Popover>
    </>
  );
};

export default AccountPopover;
