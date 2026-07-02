import { lazy, Suspense, useState } from 'react';
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
  Grid,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import * as Yup from 'yup';
import { Formik } from 'formik';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { toast } from 'react-toastify';
import useAuth from 'src/hooks/useAuth';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { addToOrgInvitations } from 'src/slices/orgInvitations';
import { useDispatch } from 'src/store';
import CreateOrgInvitation from 'src/components/organization/CreateOrgInvitation';
import { useTheme } from '@mui/material/styles';
import { useModal } from 'mui-modal-provider';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<CircularProgress />}>
    <Component {...props} />
  </Suspense>
);

const OrgInvitationsUploadDialog = Loadable(
  lazy(() => import('./OrgInvitationsUploadDialog')),
);

const OrganizationInvitationsButtons = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [newInviteOpen, setNewInviteOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  const { showModal } = useModal();

  console.log(':: OrganizationInvitationsButtons');

  const handleNewInviteClickOpen = () => {
    setNewInviteOpen(true);
  };

  const handleNewInviteClose = () => {
    setNewInviteOpen(false);
  };

  const payload = {};

  return (
    user.user_role_grants?.includes('organization_write') && (
      <Grid container spacing={3}>
        <Grid item>
          <Box sx={{ m: -1 }}>
            <Button
              color='primary'
              startIcon={<AddIcon fontSize='small' />}
              sx={{ m: 1 }}
              onClick={handleNewInviteClickOpen}
              variant='contained'
            >
              New Invitation
            </Button>
            <Dialog open={newInviteOpen} onClose={handleNewInviteClose}>
              <DialogTitle
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.background.paper,
                  px: 2,
                  py: 1,
                }}
              >
                New Invitation
              </DialogTitle>
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
                      setSubmitting(true);

                      payload['user'] = user;
                      payload['action'] = 'create';
                      payload['organization_uuid'] = user.organization_uuid;
                      payload['invitation_email'] = values.invitationEmail;

                      await CreateOrgInvitation(payload, (response) => {
                        if (!response || response.status_code !== 200) {
                          throw new Error('Invitation creation failed');
                        }
                        if (response.invitation) {
                          dispatch(addToOrgInvitations(response.invitation));
                        }
                      })
                        .then(async (data) => {
                          setNewInviteOpen(false);
                          setStatus({ success: true });
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
                  <form noValidate onSubmit={handleSubmit} {...other}>
                    <DialogContent>
                      <DialogContentText color='text.primary'>
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
                      <LoadingButton
                        color='primary'
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        type='submit'
                        variant='contained'
                      >
                        Create Invitation
                      </LoadingButton>
                      <Button
                        color='primary'
                        disabled={isSubmitting}
                        onClick={handleNewInviteClose}
                        variant='outlined'
                      >
                        Cancel
                      </Button>
                    </DialogActions>
                  </form>
                )}
              </Formik>
            </Dialog>
          </Box>
        </Grid>
        <Grid item>
          <Box sx={{ m: -1 }}>
            <Button
              color='primary'
              onClick={() => showModal(OrgInvitationsUploadDialog)}
              startIcon={<UploadFileIcon fontSize='small' />}
              sx={{ m: 1 }}
              variant='contained'
            >
              Upload Invitation List
            </Button>
          </Box>
        </Grid>
      </Grid>
    )
  );
};

export default OrganizationInvitationsButtons;
