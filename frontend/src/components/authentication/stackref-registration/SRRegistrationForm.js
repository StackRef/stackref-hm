import * as Yup from 'yup';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { Box, Chip, FormHelperText, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import SRRegisterUser from './SRRegisterUser';

const SRRegistrationForm = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user, logoutLocal } = useAuth();

  const payload = {};

  return (
    <Formik
      initialValues={{
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        jobTitle: '',
        submit: null,
      }}
      validationSchema={Yup.object().shape({
        firstName: Yup.string()
          .max(255)
          .typeError('You must enter a valid string')
          .required('First name is required'),
        lastName: Yup.string()
          .max(255)
          .typeError('You must enter a valid string')
          .required('Last name is required'),
        email: Yup.string()
          .email('Must be a valid email address')
          .max(255)
          .typeError('You must enter a valid string')
          .required('Email is required'),
        jobTitle: Yup.string()
          .typeError('You must enter a valid string')
          .max(255),
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          if (isMountedRef.current) {
            payload['user'] = user;
            payload['action'] = 'register';
            payload['first_name'] = values.firstName;
            payload['last_name'] = values.lastName;
            payload['email'] = values.email;
            payload['job_title'] = values.jobTitle;

            await SRRegisterUser(payload, (response) => {
              if (response.length !== 0) {
                console.log(`:: response: ${JSON.stringify(response)}`);
              }
            })
              .then(async () => {
                //await refresh(); // Refresh user's Auth0 token with the new registered field set to true
                setStatus({ success: true });
                setSubmitting(false);
                toast.success('Registration complete', {
                  containerId: 'results',
                });
                //logoutLocal('Registration complete. Please login.');
                window.location.reload(false);
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
          <TextField
            autoFocus
            error={Boolean(touched.firstName && errors.firstName)}
            fullWidth
            helperText={touched.firstName && errors.firstName}
            label='First Name'
            margin='normal'
            name='firstName'
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={values.firstName}
            variant='outlined'
            sx={{
              input: { color: 'text.primary' },
            }}
          />
          <TextField
            autoFocus
            error={Boolean(touched.lastName && errors.lastName)}
            fullWidth
            helperText={touched.lastName && errors.lastName}
            label='Last Name'
            margin='normal'
            name='lastName'
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={values.lastName}
            variant='outlined'
            sx={{
              input: { color: 'text.primary' },
            }}
          />
          <TextField
            autoFocus
            error={Boolean(touched.email && errors.email)}
            fullWidth
            helperText={
              <>
                This is your contact email and will not change your login email
                {touched.email && errors.email ? ` (${errors.email})` : null}
              </>
            }
            label='Email Address'
            margin='normal'
            name='email'
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={values.email}
            variant='outlined'
            sx={{
              input: { color: 'text.primary' },
            }}
          />
          <TextField
            autoFocus
            error={Boolean(touched.jobTitle && errors.jobTitle)}
            fullWidth
            helperText={touched.jobTitle && errors.jobTitle}
            label='Job Title'
            margin='normal'
            name='jobTitle'
            onBlur={handleBlur}
            onChange={handleChange}
            value={values.jobTitle}
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
              Complete Registration
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
  );
};

export default SRRegistrationForm;
