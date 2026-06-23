import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText,
  TextField,
} from '@mui/material';
import * as Yup from 'yup';
import { Formik } from 'formik';
import LoadingScreen from 'src/components/LoadingScreen';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { toast } from 'react-toastify';
import gtm from 'src/lib/gtm';
import useAuth from 'src/hooks/useAuth';
import AddIcon from '@mui/icons-material/Add';
import CreateOrgInvitation from 'src/components/organization/CreateOrgInvitation';
import GetOrgDetails from 'src/stackref/GetOrgDetails';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const UserListTable = Loadable(lazy(() => import('./UserListTable')));

const UserList = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const { initializeOrgUsers } = useStackRef();
  const [orgDetails, setOrgDetails] = useState();
  const [isLoading, setLoading] = useState(true);

  console.log(':: UserList');

  useEffect(() => {
    async function initialize() {
      gtm.push({ event: 'page_view' });
      await initializeOrgUsers();
      setLoading(false);
    }
    initialize();
  }, [initializeOrgUsers]);

  const getOrgDetails = useCallback(async () => {
    console.log(':: getOrgDetails');
    try {
      await GetOrgDetails(user)
        .then((data) => {
          setOrgDetails(data);
        })
        .catch((error) => {
          console.error('>> GetOrgDetails: ', error);
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getOrgDetails: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    getOrgDetails();
  }, [getOrgDetails]);

  const [newInviteOpen, setNewInviteOpen] = useState(false);

  const handleNewInviteClickOpen = () => {
    setNewInviteOpen(true);
  };

  const handleNewInviteClose = () => {
    setNewInviteOpen(false);
  };

  const payload = {};

  return (
    <>
      {user.user_role_grants?.includes('organization_write') && (
        <Box sx={{ m: -1 }}>
          <Button
            onClick={handleNewInviteClickOpen}
            color='primary'
            startIcon={<AddIcon fontSize='small' />}
            sx={{ m: 1 }}
            variant='contained'
          >
            New Invitation
          </Button>
          <Dialog open={newInviteOpen} onClose={handleNewInviteClose}>
            <DialogTitle>New Invitation</DialogTitle>
            <Formik
              initialValues={{
                invitationEmail: '',
                submit: null,
              }}
              validationSchema={Yup.object().shape({
                invitationEmail: Yup.string()
                  .email('Must be a valid email address')
                  .max(100)
                  .required('A valid email is required')
                  .typeError('You must specify a valid email address'),
              })}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={async (
                values,
                { setErrors, setStatus, setSubmitting },
              ) => {
                try {
                  if (isMountedRef.current) {
                    payload['user'] = user;
                    payload['action'] = 'create';
                    payload['organization_uuid'] = user.organization_uuid;
                    payload['invitation_email'] = values.invitationEmail;

                    CreateOrgInvitation(payload, (response) => {
                      if (!response || response.status_code !== 200)
                        throw new Error('Invitation creation failed');
                    })
                      .then(() => {
                        setStatus({ success: true });
                        setNewInviteOpen(false);
                        setSubmitting(false);
                        console.log(':: Invitation created');
                        toast.success('Invitation created', {
                          containerId: 'results',
                        });
                      })
                      .catch((err) => {
                        setStatus({ success: false });
                        setErrors({ submit: err.message });
                        setSubmitting(false);
                      });
                  }
                } catch (err) {
                  console.error(err);
                  if (isMountedRef.current) {
                    setStatus({ success: false });
                    setErrors({ submit: err.message });
                    setSubmitting(false);
                  }
                }
              }}
            >
              {({
                errors,
                handleBlur,
                handleChange,
                handleSubmit,
                isSubmitting,
                touched,
                values,
              }) => (
                <form noValidate onSubmit={handleSubmit} {...props}>
                  <DialogContent>
                    <DialogContentText>
                      Enter the email of the person you are inviting to this
                      Organization
                    </DialogContentText>
                    <TextField
                      autoFocus
                      error={Boolean(
                        touched.invitationEmail && errors.invitationEmail,
                      )}
                      fullWidth
                      helperText={
                        touched.invitationEmail && errors.invitationEmail
                      }
                      label='Invitee E-Mail'
                      margin='normal'
                      name='invitationEmail'
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.invitationEmail}
                      variant='outlined'
                      sx={{
                        input: { color: 'text.primary' },
                      }}
                    />
                    {errors.submit && (
                      <Box sx={{ mt: 3 }}>
                        <FormHelperText error>{errors.submit}</FormHelperText>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button
                      color='primary'
                      disabled={isSubmitting}
                      type='submit'
                    >
                      Submit
                    </Button>
                    <Button onClick={handleNewInviteClose}>Cancel</Button>
                  </DialogActions>
                </form>
              )}
            </Formik>
          </Dialog>
        </Box>
      )}
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
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
        ) : (
          <UserListTable orgDetails={orgDetails} />
        )}
      </Box>
    </>
  );
};

export default UserList;
