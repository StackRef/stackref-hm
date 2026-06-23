import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Grid } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import useIsMountedRef from 'use-is-mounted-ref';
import gtm from 'src/lib/gtm';
import useAuth from 'src/hooks/useAuth';
import GetOrgDetails from 'src/components/stackref/GetOrgDetails';
import useStackRef from 'src/hooks/useStackRef';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const UserListTable = Loadable(lazy(() => import('./UserListTable')));

const UserList = (props) => {
  const isMountedRef = useIsMountedRef();
  const { initializeOrgUsers, orgUsers } = useStackRef();
  const { user } = useAuth();
  const [orgDetails, setOrgDetails] = useState();

  console.log(':: UserList');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
    initializeOrgUsers();
  }, [initializeOrgUsers]);

  const getOrgDetails = useCallback(async () => {
    console.log(':: getOrgDetails');
    try {
      GetOrgDetails(user)
        .then((data) => {
          setOrgDetails(data);
        })
        .catch((error) => {
          console.error('>> GetOrgDetails: ', error);
          throw new Error(error);
        });
    } catch (error) {
      console.log(`>> getOrgDetails: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    getOrgDetails();
  }, [getOrgDetails]);

  return (
    <>
      <Box sx={{ mt: 3 }}>
        {orgUsers ? (
          <UserListTable orgDetails={orgDetails} />
        ) : (
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
        )}
      </Box>
    </>
  );
};

export default UserList;
