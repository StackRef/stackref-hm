import { useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Box, Drawer, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Logo } from './Logo';

const MainSidebar = (props) => {
  const { onMobileClose, openMobile } = props;
  const location = useLocation();
  const theme = useTheme();
  const hiddenLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname, onMobileClose, openMobile]);

  return hiddenLgUp ? null : (
    <Drawer
      anchor='left'
      onClose={onMobileClose}
      open={openMobile}
      variant='temporary'
      PaperProps={{
        sx: {
          backgroundColor: 'background.default',
          width: 256,
        },
      }}
    >
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 2,
        }}
      >
        <RouterLink to='/'>
          <Logo />
        </RouterLink>
        <Box
          sx={{
            display: 'flex',
            pb: 2,
            pt: 3,
          }}
        >
          <Link
            color='textSecondary'
            component={RouterLink}
            to='/dashboard'
            underline='none'
            variant='body1'
          >
            Dashboard
          </Link>
        </Box>
      </Box>
    </Drawer>
  );
};

MainSidebar.propTypes = {
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool,
};

export default MainSidebar;
