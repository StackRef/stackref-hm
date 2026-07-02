import PropTypes from 'prop-types';
import { AppBar, Box, Divider, IconButton, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import { Logo } from './Logo';

const MainNavbar = (props) => {
  const { onSidebarMobileOpen } = props;
  const theme = useTheme();
  const hiddenLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const hiddenLgDown = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <AppBar
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.secondary',
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {hiddenLgUp ? null : (
          <IconButton color='inherit' onClick={onSidebarMobileOpen}>
            <MenuIcon fontSize='small' />
          </IconButton>
        )}
        {hiddenLgDown ? null : (
          <Logo
            onClick={() => window.location.assign('https://example.com/')}
            sx={{
              cursor: 'pointer',
              height: 40,
              width: 40,
            }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
      <Divider />
    </AppBar>
  );
};

MainNavbar.propTypes = {
  onSidebarMobileOpen: PropTypes.func,
};

export default MainNavbar;
