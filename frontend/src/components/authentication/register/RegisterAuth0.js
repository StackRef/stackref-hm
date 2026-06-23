import { useState } from 'react';
import { Box, Button, FormHelperText } from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';

const RegisterAuth0 = (props) => {
  const isMountedRef = useIsMountedRef();
  const { loginWithRedirect } = useAuth();
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/dashboard',
        },
      });
    } catch (err) {
      console.error(`>> handleRegister: ${err}`);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  };

  return (
    <div {...props}>
      {error && (
        <Box sx={{ my: 3 }}>
          <FormHelperText error>{error}</FormHelperText>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Button color='primary' onClick={handleRegister} variant='contained'>
          Register
        </Button>
      </Box>
    </div>
  );
};

export default RegisterAuth0;
