import { useState } from 'react';
import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';

const LoginAuth0 = (props) => {
  const { buttonText, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { loginWithRedirect } = useAuth();
  const [error, setError] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/dashboard',
        },
      });
    } catch (err) {
      //err.message !== 'Login required' && !err.message?.includes('Missing Refresh Token') && console.error(`>> handleLogin: ${err}`);
      err.message !== 'Login required' &&
        console.error(`>> handleLogin: ${err}`);
      if (isMountedRef.current) {
        setError(err.message);
      }
      setSubmitting(false);
    }
  };

  return (
    <div {...other}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <LoadingButton
          color='primary'
          loading={isSubmitting}
          onClick={handleLogin}
          variant='contained'
        >
          {buttonText || 'Log In / Sign Up'}
        </LoadingButton>
      </Box>
    </div>
  );
};

export default LoginAuth0;
