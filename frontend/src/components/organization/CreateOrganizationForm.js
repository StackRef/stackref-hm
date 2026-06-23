import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { Select, TextField } from 'formik-mui';
import { toast } from 'react-toastify';
import {
  Box,
  Chip,
  FormHelperText,
  Grid,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PhoneInput from 'react-phone-number-input/input';
import PhoneNumber from 'src/components/PhoneNumber';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { uSStateList } from 'src/components/uSStateList';
import CreateOrganization from './CreateOrganization';

const CreateOrganizationForm = (props) => {
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
    window.location.reload(true);
  }

  function getDomainFromEmail(email) {
    const sharedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
    const domain = email.substring(email.lastIndexOf('@') + 1);
    if (sharedDomains.includes(domain)) return '';
    return domain;
  }

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
        <Typography color='textPrimary' gutterBottom variant='h5'>
          Create A New Organization
        </Typography>
      </Box>
      <Formik
        initialValues={{
          organizationName: '',
          organizationDomain: getDomainFromEmail(user.email),
          orgPrimaryEmail: user.email,
          orgStreetAddr1: '',
          orgStreetAddr2: '',
          organizationCity: '',
          organizationState: '',
          organizationZip: '',
          organizationPhone: '',
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          organizationName: Yup.string()
            .max(255)
            .required('Organization name is required')
            .typeError('You must specify a valid Organization name'),
          organizationDomain: Yup.string()
            .max(50)
            .required('Domain name name is required')
            .typeError('You must specify a valid domain name'),
          orgPrimaryEmail: Yup.string()
            .email('Must be a valid email address')
            .max(100)
            .required('A primary contact email is required')
            .typeError('You must specify a valid email address'),
          orgStreetAddr1: Yup.string()
            .max(255)
            .required('A valid street address is required')
            .typeError('You must specify a valid street address'),
          orgStreetAddr2: Yup.string().nullable().max(255),
          organizationCity: Yup.string()
            .max(100)
            .required('A valid city is required')
            .typeError('You must specify a valid city'),
          organizationState: Yup.string()
            .max(25)
            .required('A valid state/region is required')
            .typeError('You must specify a valid state/region'),
          organizationZip: Yup.string()
            .max(25)
            .required('A valid zip/postal code is required')
            .typeError('You must specify a valid zip/postal code'),
          organizationPhone: Yup.string()
            .max(25)
            .required('A valid phone number is required')
            .typeError('You must specify a valid phone number'),
        })}
        validateOnChange={false}
        validateOnBlur={true}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            if (isMountedRef.current) {
              const payload = {};
              payload['user'] = user;
              payload['action'] = 'create';
              payload['organization_name'] = values.organizationName;
              payload['organization_domain'] = values.organizationDomain;
              payload['primary_contact_email'] = values.orgPrimaryEmail;
              payload['street_address_1'] = values.orgStreetAddr1;
              payload['street_address_2'] = values.orgStreetAddr2;
              payload['city'] = values.organizationCity;
              payload['state_region'] = values.organizationState;
              payload['postal_code'] = values.organizationZip;
              payload['phone'] = values.organizationPhone;

              await CreateOrganization(payload, (response) => {
                if (
                  !response ||
                  response.status_code !== 200 ||
                  !response.organization_uuid
                )
                  throw new Error(
                    `${
                      response?.error
                        ? response.error
                        : 'Organization create failed'
                    }`,
                  );
                //logoutLocal('Organization creation successful!', 'Access Dashboard');
                handleLogin();
                setStatus({ success: true });
                setSubmitting(false);
                toast.success('Organization created', {
                  containerId: 'results',
                });
                //refreshPage();
              }).catch((err) => {
                setStatus({ success: false });
                setErrors({ submit: err.message });
                setSubmitting(false);
              });
            }
          } catch (err) {
            console.error(`>> CreateOrganization: ${err}`);
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Field
                  component={TextField}
                  error={Boolean(
                    touched.organizationName && errors.organizationName,
                  )}
                  fullWidth
                  helperText={
                    touched.organizationName && errors.organizationName
                  }
                  label='Organization Name'
                  margin='normal'
                  required
                  name='organizationName'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.organizationName}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
              </Grid>
              <Grid item>
                <Field
                  component={TextField}
                  error={Boolean(
                    touched.organizationDomain && errors.organizationDomain,
                  )}
                  fullWidth
                  helperText={
                    touched.organizationDomain && errors.organizationDomain
                  }
                  label='Organization Domain'
                  margin='normal'
                  required
                  name='organizationDomain'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.organizationDomain}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
              </Grid>
            </Grid>
            <Field
              component={TextField}
              error={Boolean(touched.orgStreetAddr1 && errors.orgStreetAddr1)}
              fullWidth
              helperText={touched.orgStreetAddr1 && errors.orgStreetAddr1}
              label='Street Address 1'
              margin='normal'
              required
              name='orgStreetAddr1'
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.orgStreetAddr1}
              variant='outlined'
              sx={{
                input: { color: 'text.primary' },
              }}
            />
            <Field
              component={TextField}
              error={Boolean(touched.orgStreetAddr2 && errors.orgStreetAddr2)}
              fullWidth
              helperText={touched.orgStreetAddr2 && errors.orgStreetAddr2}
              label='Street Address 2'
              margin='normal'
              name='orgStreetAddr2'
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.orgStreetAddr2}
              variant='outlined'
              sx={{
                input: { color: 'text.primary' },
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={5}>
                <Field
                  component={TextField}
                  error={Boolean(
                    touched.organizationCity && errors.organizationCity,
                  )}
                  fullWidth
                  helperText={
                    touched.organizationCity && errors.organizationCity
                  }
                  label='City'
                  margin='normal'
                  required
                  name='organizationCity'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.organizationCity}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
              </Grid>
              <Grid
                item
                sx={{
                  mt: 2,
                }}
              >
                <Field
                  component={Select}
                  value={values.organizationState}
                  label='State'
                  name='organizationState'
                  onChange={(event) =>
                    (values.organizationState = event.target.value)
                  }
                  required
                  size='small'
                  sx={{
                    minWidth: 100,
                    minHeight: 55,
                  }}
                >
                  {uSStateList.map((uSState) => {
                    return (
                      <MenuItem
                        key={uSState.value}
                        label={uSState.value}
                        value={uSState.value}
                      >
                        <ListItemText primary={uSState.value} />
                      </MenuItem>
                    );
                  })}
                </Field>
              </Grid>
              <Grid item>
                <Field
                  component={TextField}
                  error={Boolean(
                    touched.organizationZip && errors.organizationZip,
                  )}
                  fullWidth
                  helperText={touched.organizationZip && errors.organizationZip}
                  label='Zip/Postal Code'
                  margin='normal'
                  required
                  name='organizationZip'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.organizationZip}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid
                item
                xs={6}
                sx={{
                  mt: 2,
                }}
              >
                <PhoneInput
                  country='US'
                  placeholder='Phone number'
                  value={values.organizationPhone}
                  name='organizationPhone'
                  required
                  //onChange={setOrgPhone}
                  onChange={(event) => (values.organizationPhone = event)}
                  inputComponent={PhoneNumber}
                />
              </Grid>
              <Grid item xs={4}>
                <Field
                  component={TextField}
                  error={Boolean(
                    touched.orgPrimaryEmail && errors.orgPrimaryEmail,
                  )}
                  fullWidth
                  helperText={touched.orgPrimaryEmail && errors.orgPrimaryEmail}
                  label='Primary Contact E-Mail'
                  margin='normal'
                  required
                  name='orgPrimaryEmail'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.orgPrimaryEmail}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
              </Grid>
            </Grid>
            <Box
              sx={{
                align: 'center',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                mt: 2,
                width: '100%',
              }}
            >
              <LoadingButton
                color='primary'
                disabled={isSubmitting}
                loading={isSubmitting}
                size='large'
                type='submit'
                variant='contained'
              >
                Create Organization
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

export default CreateOrganizationForm;
