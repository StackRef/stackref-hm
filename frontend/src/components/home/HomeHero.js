import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Logo, LogoBlurb } from 'src/components/Logo';

const HomeHero = (props) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(false);
    })();
  }, [theme.palette.mode]);

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        pt: 6,
      }}
      {...props}
    >
      <Container
        maxWidth='md'
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          px: {
            md: '130px !important',
          },
        }}
      >
        <Logo
          sx={{
            width: '160px',
            height: '160px',
          }}
        />
        <LogoBlurb
          width='80%'
          height='80%'
          viewBox='0 0 380 120'
          sx={{
            width: '400px',
            height: '120px',
          }}
        />
        <Button
          color='primary'
          component={RouterLink}
          size='large'
          to='/dashboard'
          variant='contained'
        >
          Dashboard
        </Button>
      </Container>
      <Container
        maxWidth='lg'
        sx={{
          width: '100%',
          px: {
            md: 15,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            pt: !isLoading && '15%',
          }}
        >
          {isLoading ? (
            <Skeleton
              sx={{
                borderRadius: 1,
                width: '100%',
                pt: '15%',
              }}
              variant='rectangular'
            />
          ) : (
            <></>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
