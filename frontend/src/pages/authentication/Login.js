import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Typography,
} from '@mui/material';
import LoginAuth0 from 'src/components/authentication/login/LoginAuth0';
import { LogoBlurb } from 'src/components/Logo';
import useAuth from 'src/hooks/useAuth';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { stackrefConfig } from 'src/config';

const Login = () => {
  const { logout, logoutMessage, buttonText } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    toast.dismiss({ containerId: 'results' });
    toast.dismiss({ containerId: 'notifications' });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/dashboard');
    } catch (err) {
      console.error(`>> handleLogout: ${err}`);
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth='sm' sx={{ py: '80px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 8,
            }}
          >
            <LogoBlurb
              onClick={() => window.location.assign('https://example.com/')}
              width='100%'
              height='100%'
              viewBox='0 0 380 108'
              sx={{
                cursor: 'pointer',
                width: '380px',
                height: '108px',
              }}
            />
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
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Typography
                  color='textPrimary'
                  gutterBottom
                  variant='h5'
                  sx={{
                    mb: 2,
                  }}
                >
                  {searchParams.get('email_verified') ? 'Thank You!' : null}
                  {searchParams.get('error') && 'Offsides!'}
                </Typography>
                {logoutMessage ? (
                  <Typography
                    color='textSecondary'
                    variant='body2'
                    sx={{
                      mb: 2,
                    }}
                  >
                    {logoutMessage}
                  </Typography>
                ) : null}
                {searchParams.get('message') ? (
                  <Typography
                    color='textSecondary'
                    variant='body2'
                    sx={{
                      mb: 2,
                    }}
                  >
                    {searchParams.get('message')}
                  </Typography>
                ) : null}
                <Typography color='textSecondary' variant='body2'>
                  {searchParams.get('email_verified') === 'false'
                    ? 'Please first check your inbox and verify your email address'
                    : searchParams.get('error_description')
                      ? searchParams.get('error_description')
                      : 'Login or Sign-Up to access the StackRef Dashboard'}
                </Typography>
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  mt: 3,
                }}
              >
                {searchParams.get('email_verified') === 'false' ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <Button onClick={handleLogout} variant='contained'>
                      OK
                    </Button>
                  </Box>
                ) : searchParams.get('error') ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <Button href={'/dashboard'} variant='contained'>
                      Gotcha
                    </Button>
                  </Box>
                ) : (
                  <LoginAuth0 buttonText={buttonText} />
                )}
              </Box>
            </CardContent>
          </Card>
          {stackrefConfig.uiEnvironment === 'beta' ? (
            <Card
              sx={{
                mt: 2,
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent>
                <Typography color='text.secondary'>
                  This version of StackRef is currently in beta
                </Typography>
                <Typography>
                  Please report any issues to{' '}
                  <Link
                    href='mailto:info@example.com'
                    color='textPrimary'
                    underline='hover'
                  >
                    info@example.com
                  </Link>
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Container>
      </Box>
    </>
  );
};

export default Login;
