import { lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Paper, Typography } from '@mui/material';
import { LogoBlurb } from 'src/components/Logo';
import gtm from 'src/lib/gtm';
import { useTheme } from '@mui/material/styles';
import DashboardNavbar from 'src/components/dashboard/DashboardNavbar';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const CreateOrganizationForm = Loadable(
  lazy(() => import('src/components/organization/CreateOrganizationForm')),
);
const OrganizationInvitationForm = Loadable(
  lazy(() => import('src/components/organization/OrganizationInvitationForm')),
);

const CreateJoinOrganization = () => {
  const theme = useTheme();

  function getDomainFromEmail(email) {
    return email.substring(email.lastIndexOf('@') + 1);
  }

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Create or Join an Organization | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <DashboardNavbar />
        <Box
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: '80px',
          }}
        >
          <LogoBlurb
            onClick={() => window.location.assign('https://example.com/')}
            width='100%'
            height='100%'
            viewBox='0 0 400 120'
            sx={{
              cursor: 'pointer',
              width: '400px',
              height: '120px',
            }}
          />
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            width: '100%',
          }}
        >
          <Typography
            color='textSecondary'
            variant='body1'
            sx={{
              mb: 2,
            }}
          >
            If you've received (or expect to soon receive) an invitation code to
            join an organization in StackRef, enter and Accept it below.
          </Typography>
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Paper
            sx={{
              p: 2,
            }}
          >
            <OrganizationInvitationForm />
          </Paper>
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Paper
            sx={{
              mt: 4,
              mx: 10,
              p: 2,
              width: '60%',
            }}
          >
            <Typography
              color='textSecondary'
              variant='body1'
              sx={{
                mb: 2,
              }}
            >
              If you do not have an invitation code and you are the first to
              create an organization for your events, please complete and submit
              the following form.
            </Typography>
            <CreateOrganizationForm />
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default CreateJoinOrganization;
