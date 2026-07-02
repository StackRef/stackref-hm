import * as Yup from 'yup';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Box,
  Chip,
  FormHelperText,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import AcceptOrgInvitation from './AcceptOrgInvitation';

const OrganizationInvitationForm = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user, loginWithRedirect } = useAuth();

  const handleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/dashboard',
        },
      });
    } catch (err) {
      console.error(`>> handleLogin: ${err}`);
    }
  };

  function refreshPage() {
    window.location.reload(false);
  }

  const payload = {};

  return (
    <>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography color='textPrimary' gutterBottom variant='h6'>
          Accept Organization Invitation
        </Typography>
      </Box>
      <Formik
        initialValues={{
          invitationCode: '',
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          invitationCode: Yup.string()
            .max(25)
            .required('An invitation code is required')
            .typeError('You must specify a valid invitation code'),
        })}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            if (isMountedRef.current) {
              payload['user'] = user;
              payload['invitation_code'] = values.invitationCode;

              await AcceptOrgInvitation(payload, (response) => {
                if (!response || response.status_code !== 200)
                  throw new Error(
                    `${
                      response?.error
                        ? response.error
                        : 'There was a problem accepting the invitation code provided'
                    }`,
                  );
                setStatus({ success: true });
                setSubmitting(false);
                toast.success('Invitation processed', {
                  containerId: 'results',
                });
                handleLogin();
                //refreshPage();
              }).catch((err) => {
                setStatus({ success: false });
                setErrors({ submit: err.message });
                setSubmitting(false);
                toast.error('Invitation acceptance failed', {
                  containerId: 'results',
                });
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
            <TextField
              autoFocus
              error={Boolean(touched.invitationCode && errors.invitationCode)}
              fullWidth
              helperText={touched.invitationCode && errors.invitationCode}
              label='Invitation Code'
              margin='normal'
              name='invitationCode'
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.invitationCode}
              variant='outlined'
              sx={{
                input: { color: 'text.primary' },
              }}
            />
            <Box sx={{ mt: 2 }}>
              <LoadingButton
                color='primary'
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth
                size='large'
                type='submit'
                variant='contained'
              >
                Accept Invitation
              </LoadingButton>
            </Box>
            <Box sx={{ display: 'flex', mt: 2, justifyContent: 'center' }}>
              {errors.submit && (
                <Chip
                  label={<FormHelperText error>{errors.submit}</FormHelperText>}
                />
              )}
            </Box>
          </form>
        )}
      </Formik>
    </>
  );
};

export default OrganizationInvitationForm;
