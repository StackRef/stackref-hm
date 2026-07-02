import { useState } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import MainNavbar from './MainNavbar';
import MainSidebar from './MainSidebar';

const MainLayoutRoot = styled('div')(({ theme }) => ({
  bgcolor: theme.palette.background.default,
  height: '100%',
  paddingTop: 64,
}));

const MainLayout = ({ children }) => {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  return (
    <MainLayoutRoot>
      <MainNavbar onSidebarMobileOpen={() => setIsSidebarMobileOpen(true)} />
      <MainSidebar
        onMobileClose={() => setIsSidebarMobileOpen(false)}
        openMobile={isSidebarMobileOpen}
      />
      {children || <Outlet />}
      <Footer />
    </MainLayoutRoot>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
