import { Suspense, lazy, useState, useEffect } from 'react';
import { Box, CircularProgress, Grid } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import gtm from 'src/lib/gtm';
import useAuth from 'src/hooks/useAuth';
import { useDispatch } from 'src/store';
import { getOrgInvitations } from 'src/slices/orgInvitations';
import ModalProvider from 'mui-modal-provider';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const OrgInvitationListTable = Loadable(
  lazy(() => import('./OrgInvitationListTable')),
);
const OrganizationInvitationsButtons = Loadable(
  lazy(() => import('./OrganizationInvitationsButtons')),
);

const OrganizationInvitations = (props) => {
  const isMountedRef = useIsMountedRef();
  const [isLoading, setLoading] = useState(true);
  const { user } = useAuth();
  const dispatch = useDispatch();

  console.log(':: OrganizationInvitations');

  useEffect(() => {
    async function initialize() {
      gtm.push({ event: 'page_view' });
      dispatch(getOrgInvitations({ user: user }));
      setLoading(false);
    }
    initialize();
  }, [dispatch, user]);

  return (
    <ModalProvider>
      <OrganizationInvitationsButtons />
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Grid
            container
            spacing={0}
            direction='column'
            alignItems='center'
            justifyContent='center'
            style={{ minHeight: '100vh' }}
          >
            <CircularProgress />
          </Grid>
        ) : (
          <OrgInvitationListTable />
        )}
      </Box>
    </ModalProvider>
  );
};

export default OrganizationInvitations;
