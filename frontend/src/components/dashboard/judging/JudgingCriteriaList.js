import { Suspense, lazy, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import LoadingScreen from 'src/components/LoadingScreen';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import gtm from 'src/lib/gtm';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const JudgingCriteriaListTable = Loadable(
  lazy(() => import('./JudgingCriteriaListTable')),
);

const JudgingCriteriaList = (props) => {
  const { team, judge, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [isLoading, setLoading] = useState(true);

  console.log(':: JudgingCriteriaList');

  useEffect(() => {
    gtm.push({ event: 'page_view' });
    setLoading(false);
  }, []);

  return (
    <Box sx={{ mt: 3 }}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <JudgingCriteriaListTable team={team} judge={judge} />
      )}
    </Box>
  );
};

export default JudgingCriteriaList;
