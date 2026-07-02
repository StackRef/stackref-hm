import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import { WebSocketProvider } from 'src/contexts/WebSocketContext';
import { ConfirmProvider } from 'material-ui-confirm';
import { NotificationsProvider } from 'src/contexts/NotificationsContext';
import { SpotifyProvider } from 'src/contexts/SpotifyContext';
import { Helmet } from 'react-helmet-async';

import DashboardNavbar from './DashboardNavbar';
import DashboardSidebar from './DashboardSidebar';
import useSettings from 'src/hooks/useSettings';
import TatorMessaging from './TatorMessaging';

const DashboardLayoutWrapper = styled('div')(({ theme, ...props }) => ({
  bgcolor: theme.palette.background.default,
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden',
  pt: '64px',
  [theme.breakpoints.up('lg')]: {
    paddingLeft: props?.minimized ? '70px' : '280px',
  },
}));

const DashboardLayoutRoot = styled('div')(({ theme }) => ({
  bgcolor: theme.palette.background.default,
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
  width: '100%',
}));

const DashboardLayoutContainer = styled('div')(({ theme }) => ({
  bgcolor: theme.palette.background.default,
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden',
}));

const DashboardLayoutContent = styled('div')(({ theme }) => ({
  bgcolor: theme.palette.background.default,
  flex: '1 1 auto',
  height: '100%',
  overflow: 'auto',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
}));

const ToastBlock = () => {
  return (
    <>
      <ToastContainer
        containerId='notifications'
        id='notifications'
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        limit={3}
        rtl={false}
        draggable
        pauseOnHover
        pauseOnFocusLoss={false}
        theme='dark'
        style={{ marginTop: '50px' }}
      />
      <ToastContainer
        containerId='results'
        id='results'
        position='bottom-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        limit={3}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme='colored'
      />
    </>
  );
};

const DashboardLayout = () => {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <ConfirmProvider>
      <NotificationsProvider>
        <WebSocketProvider>
          <SpotifyProvider>
            <DashboardLayoutRoot>
              {!isMobile && !settings?.minimizedSidebar ? (
                <Helmet>
                  <script
                    type='text/javascript'
                    id='hs-script-loader'
                    async
                    defer
                    src='//js-na1.hs-scripts.com/21983709.js'
                  ></script>
                  <style type='text/css'>{`
                    div#hubspot-messages-iframe-container {
                      display:inherit!important;
                    }
                  `}</style>
                </Helmet>
              ) : (
                <Helmet>
                  <style type='text/css'>{`
                    div#hubspot-messages-iframe-container {
                      display:none!important;
                    }
                  `}</style>
                </Helmet>
              )}
              <TatorMessaging />
              <DashboardNavbar
                onSidebarMobileOpen={() =>
                  setSidebarMobileOpen(!!!isSidebarMobileOpen)
                }
              />
              <DashboardSidebar
                onMobileClose={() => setSidebarMobileOpen(false)}
                openMobile={isSidebarMobileOpen}
              />
              <DashboardLayoutWrapper
                minimized={settings?.minimizedSidebar ? 1 : 0}
              >
                <DashboardLayoutContainer>
                  <DashboardLayoutContent>
                    <Outlet />
                  </DashboardLayoutContent>
                </DashboardLayoutContainer>
              </DashboardLayoutWrapper>
            </DashboardLayoutRoot>
            <ToastBlock />
          </SpotifyProvider>
        </WebSocketProvider>
      </NotificationsProvider>
    </ConfirmProvider>
  );
};

export default DashboardLayout;
