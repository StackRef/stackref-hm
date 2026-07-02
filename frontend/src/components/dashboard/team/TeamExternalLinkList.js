import { Suspense, lazy } from 'react';
import { Box, Typography } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamExternalLinkListTable = Loadable(
  lazy(() => import('./TeamExternalLinkListTable')),
);

const TeamExternalLinkList = (props) => {
  const { ...other } = props;

  console.log(':: TeamExternalLinkList');

  return (
    <Box sx={{ mt: 3 }} {...other}>
      <Typography
        color='primary'
        sx={{
          mb: 1,
        }}
      >
        External links not marked as Private are viewable only by team members.
        All others are used for judging purposes.
      </Typography>
      <TeamExternalLinkListTable />
    </Box>
  );
};

export default TeamExternalLinkList;
