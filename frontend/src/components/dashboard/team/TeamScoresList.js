import { Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamScoresListTable = Loadable(
  lazy(() => import('./TeamScoresListTable')),
);

const TeamScoresList = (props) => {
  const { ...other } = props;

  console.log(':: TeamScoresList');

  return (
    <Box {...other}>
      <TeamScoresListTable />
    </Box>
  );
};

export default TeamScoresList;
