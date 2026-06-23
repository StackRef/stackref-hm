import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Card, CardContent, Container, Typography } from '@mui/material';
import SRRegistrationForm from 'src/components/authentication/stackref-registration/SRRegistrationForm';
import { LogoBlurb } from 'src/components/Logo';
import useAuth from 'src/hooks/useAuth';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import DashboardNavbar from 'src/components/dashboard/DashboardNavbar';

const SRRegistration = () => {
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Registration | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <DashboardNavbar />
        <Container maxWidth='sm' sx={{ py: '80px' }}>
          <Box
            sx={{
              mb: 8,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <RouterLink to='/'>
              <LogoBlurb
                width='100%'
                height='100%'
                viewBox='0 0 400 120'
                sx={{
                  width: '400px',
                  height: '120px',
                }}
              />
            </RouterLink>
          </Box>
          <Card>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 4,
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <div>
                  <Typography color='textPrimary' gutterBottom variant='h5'>
                    Complete Your Registration to StackRef
                  </Typography>
                  <Typography color='textSecondary' variant='body2'>
                    Please complete your registration to the StackRef platform.
                  </Typography>
                </div>
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  mt: 3,
                }}
              >
                <SRRegistrationForm />
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export default SRRegistration;
