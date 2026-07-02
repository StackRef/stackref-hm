import { Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import gtm from 'src/lib/gtm';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const TeamExternalLinkListTable = Loadable(
  lazy(() => import('./TeamExternalLinkListTable')),
);

const TeamExternalLinkList = (props) => {
  const { team, ...other } = props;

  console.log(':: TeamExternalLinkList');

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <TeamExternalLinkListTable team={team} />
      </Box>
    </>
  );
};

export default TeamExternalLinkList;
