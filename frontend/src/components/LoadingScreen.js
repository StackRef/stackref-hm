import { useEffect } from 'react';
import NProgress from 'nprogress';
import { Box, CircularProgress, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LoadingScreen = () => {
  const theme = useTheme();

  /*
  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100%'
      }}
    />
  );
  */

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100%',
      }}
    >
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
    </Box>
  );
};

export default LoadingScreen;
