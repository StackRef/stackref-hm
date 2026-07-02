import { lazy } from 'react';
import PropTypes from 'prop-types';
import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { Logo } from 'src/components/Logo';
import useAuth from 'src/hooks/useAuth';

const AccountPopover = lazy(() => import('./AccountPopover'));
const EventPopover = lazy(() => import('./EventPopover'));
const NotificationsPopover = lazy(() => import('./NotificationsPopover'));
const ServerStatusPopover = lazy(() => import('./ServerStatusPopover'));
const TeamPopover = lazy(() => import('./TeamPopover'));
const SpotifyPopover = lazy(() => import('./SpotifyPopover'));

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  ...(theme.palette.mode === 'light' && {
    bgcolor: theme.palette.primary.main,
    boxShadow: 'none',
    color: theme.palette.primary.contrastText,
  }),
  ...(theme.palette.mode === 'dark' && {
    bgcolor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
  }),
  zIndex: theme.zIndex.drawer + 100,
}));

const DashboardNavbar = (props) => {
  const { onSidebarMobileOpen, ...other } = props;
  const theme = useTheme();
  const hiddenLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const hiddenLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useAuth();

  console.log(':: DashboardNavbar');

  return (
    <DashboardNavbarRoot {...other}>
      <Toolbar sx={{ minHeight: 64 }}>
        {hiddenLgUp ? null : (
          <IconButton color='inherit' onClick={onSidebarMobileOpen}>
            <MenuIcon />
          </IconButton>
        )}
        <Logo
          onClick={() => window.location.assign('https://example.com/')}
          sx={{
            cursor: 'pointer',
            height: 40,
            width: 40,
          }}
        />
        <Box
          sx={{
            flexGrow: 1,
            ml: 2,
          }}
        />
        {user.organization_uuid ? (
          <>
            <Box sx={{ ml: 1 }}>
              <SpotifyPopover />
            </Box>
            <Box sx={{ ml: 1 }}>
              <EventPopover />
            </Box>
            <Box sx={{ ml: 1 }}>
              <ServerStatusPopover />
            </Box>
            <Box sx={{ ml: 1 }}>
              <TeamPopover />
            </Box>
            <Box sx={{ ml: 1 }}>
              <NotificationsPopover />
            </Box>
          </>
        ) : null}
        <Box sx={{ ml: 2 }}>
          <AccountPopover />
        </Box>
      </Toolbar>
    </DashboardNavbarRoot>
  );
};

DashboardNavbar.propTypes = {
  onSidebarMobileOpen: PropTypes.func,
};

export default DashboardNavbar;
