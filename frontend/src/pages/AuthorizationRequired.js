import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Button, Container, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import gtm from 'src/lib/gtm';

const AuthorizationRequired = (props) => {
  const { title, message, ...other } = props;

  const theme = useTheme();
  const mobileDevice = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Error: Authorization Required | StackRef</title>
      </Helmet>
      <Box
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          display: 'flex',
          minHeight: '100%',
          height: '100vh',
          px: 3,
          py: '80px',
        }}
      >
        <Container maxWidth='lg'>
          <Typography
            align='center'
            color='textPrimary'
            variant={mobileDevice ? 'h4' : 'h1'}
          >
            {title ? title : 'Authorization required'}
          </Typography>
          <Typography
            align='center'
            color='textSecondary'
            sx={{ mt: 0.5 }}
            variant='subtitle2'
          >
            {message
              ? message
              : 'You either tried some shady route or you came here by mistake. Whichever it is, try using the navigation.'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 6,
            }}
          >
            <Button
              color='primary'
              component={RouterLink}
              to='/'
              variant='outlined'
            >
              Back to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default AuthorizationRequired;
