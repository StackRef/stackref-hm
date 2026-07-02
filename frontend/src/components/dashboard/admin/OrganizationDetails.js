import { useCallback, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { Select, TextField } from 'formik-mui';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormHelperText,
  Grid,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import UpdateOrganization from 'src/components/organization/UpdateOrganization';
import OrganizationStackCash from './OrganizationStackCash';
import GetOrgDetails from 'src/components/stackref/GetOrgDetails';
import { uSStateList } from 'src/components/uSStateList';
import PhoneInput from 'react-phone-number-input/input';
import PhoneNumber from 'src/components/PhoneNumber';
import LoadingScreen from 'src/components/LoadingScreen';
import { useTheme } from '@mui/material/styles';

const OrganizationDetails = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [orgDetails, setOrgDetails] = useState();
  const [isEditing, setEditing] = useState(false);
  const theme = useTheme();

  const handleFieldChange = () => {
    setEditing(true);
  };

  console.log(':: OrganizationDetails');

  const getOrgDetails = useCallback(async () => {
    console.log(':: getOrgDetails');
    try {
      await GetOrgDetails(user)
        .then((data) => {
          setOrgDetails(data);
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getOrgDetails: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    getOrgDetails();
  }, [getOrgDetails]);

  const payload = {};

  return !orgDetails ? (
    <LoadingScreen />
  ) : (
    <>
      <Box
        sx={{
          align: 'center',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
          width: '100%',
        }}
      >
        <Typography color='text.primary' sx={{ fontWeight: 'bold' }}>
          Organization Status/Tier:
        </Typography>
        <Chip
          color={
            orgDetails.organization_status === 'Unlimited'
              ? 'success'
              : orgDetails.organization_status === 'Standard'
                ? 'primary'
                : 'error'
          }
          label={orgDetails.organization_status}
          sx={{
            ml: 1,
          }}
        />
      </Box>
      {orgDetails.organization_status !== 'Unlimited' && (
        <Box
          sx={{
            align: 'center',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            width: '100%',
          }}
        >
          <Typography color='text.secondary' variant='subtitle1'>
            Interested in our "Unlimited" tier? Contact StackRef for more
            details!
          </Typography>
        </Box>
      )}
      <Card
        sx={{
          m: 'auto',
          width: '80%',
        }}
      >
        <CardHeader
          title='Organization Details'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            py: 1,
          }}
        />
        <CardContent>
          <Box>
            <Formik
              initialValues={{
                organizationUUID: user.organization_uuid,
                organizationName: orgDetails.organization_name || '',
                organizationDomain: orgDetails.organization_domain || '',
                orgPrimaryEmail: orgDetails.primary_contact_email || '',
                orgStreetAddr1: orgDetails.street_address_1 || '',
                orgStreetAddr2: orgDetails.street_address_2 || '',
                organizationCity: orgDetails.city || '',
                organizationState: orgDetails.state_region || '',
                organizationZip: orgDetails.postal_code || '',
                organizationPhone: orgDetails.phone || '',
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
              validateOnBlur={false}
              onSubmit={async (
                values,
                { setErrors, setStatus, setSubmitting },
              ) => {
                try {
                  if (isMountedRef.current) {
                    setSubmitting(true);

                    payload['user'] = user;
                    payload['action'] = 'update';
                    payload['organization_uuid'] = values.organizationUUID;
                    payload['organization_name'] = values.organizationName;
                    payload['organization_domain'] = values.organizationDomain;
                    payload['primary_contact_email'] = values.orgPrimaryEmail;
                    payload['street_address_1'] = values.orgStreetAddr1;
                    payload['street_address_2'] = values.orgStreetAddr2;
                    payload['city'] = values.organizationCity;
                    payload['state_region'] = values.organizationState;
                    payload['postal_code'] = values.organizationZip;
                    payload['phone'] = values.organizationPhone;

                    await UpdateOrganization(payload, (response) => {
                      if (!response || response.status_code !== 200)
                        throw new Error('Organization update failed');
                    })
                      .then(() => {
                        setStatus({ success: true });
                        setSubmitting(false);
                        setEditing(false);
                        toast.success('Organization updated', {
                          containerId: 'results',
                        });
                      })
                      .catch((err) => {
                        setStatus({ success: false });
                        setErrors({ submit: err.message });
                        setSubmitting(false);
                        setEditing(false);
                      });
                  }
                } catch (err) {
                  console.error(`>> UpdateOrganization: ${err}`);
                  if (isMountedRef.current) {
                    setStatus({ success: false });
                    setErrors({ submit: err.message });
                    setSubmitting(false);
                    setEditing(false);
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
                        autoFocus
                        error={Boolean(
                          touched.organizationName && errors.organizationName,
                        )}
                        fullWidth
                        helperText={
                          touched.organizationName && errors.organizationName
                        }
                        label='Organization Name'
                        margin='normal'
                        name='organizationName'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
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
                        autoFocus
                        error={Boolean(
                          touched.organizationDomain &&
                            errors.organizationDomain,
                        )}
                        fullWidth
                        helperText={
                          touched.organizationDomain &&
                          errors.organizationDomain
                        }
                        label='Organization Domain'
                        margin='normal'
                        name='organizationDomain'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
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
                    autoFocus
                    error={Boolean(
                      touched.orgStreetAddr1 && errors.orgStreetAddr1,
                    )}
                    fullWidth
                    helperText={touched.orgStreetAddr1 && errors.orgStreetAddr1}
                    label='Street Address 1'
                    margin='normal'
                    name='orgStreetAddr1'
                    onBlur={handleBlur}
                    onChange={(event) => {
                      handleChange(event);
                      handleFieldChange();
                    }}
                    value={values.orgStreetAddr1}
                    variant='outlined'
                    sx={{
                      input: { color: 'text.primary' },
                    }}
                  />
                  <Field
                    component={TextField}
                    autoFocus
                    error={Boolean(
                      touched.orgStreetAddr2 && errors.orgStreetAddr2,
                    )}
                    fullWidth
                    helperText={touched.orgStreetAddr2 && errors.orgStreetAddr2}
                    label='Street Address 2'
                    margin='normal'
                    name='orgStreetAddr2'
                    onBlur={handleBlur}
                    onChange={(event) => {
                      handleChange(event);
                      handleFieldChange();
                    }}
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
                        autoFocus
                        error={Boolean(
                          touched.organizationCity && errors.organizationCity,
                        )}
                        fullWidth
                        helperText={
                          touched.organizationCity && errors.organizationCity
                        }
                        label='City'
                        margin='normal'
                        name='organizationCity'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
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
                        onChange={(event) => {
                          values.organizationState = event.target.value;
                          handleFieldChange();
                        }}
                        //onChange={(event) => { values.organizationState = event.target.value}
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
                        autoFocus
                        error={Boolean(
                          touched.organizationZip && errors.organizationZip,
                        )}
                        fullWidth
                        helperText={
                          touched.organizationZip && errors.organizationZip
                        }
                        label='Zip/Postal Code'
                        margin='normal'
                        name='organizationZip'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
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
                      sx={{
                        mt: 2,
                      }}
                    >
                      <PhoneInput
                        country='US'
                        placeholder='Phone number'
                        value={values.organizationPhone}
                        name='organizationPhone'
                        onChange={(event) => {
                          values.organizationPhone = event;
                          handleFieldChange();
                        }}
                        inputComponent={PhoneNumber}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Field
                        component={TextField}
                        autoFocus
                        error={Boolean(
                          touched.orgPrimaryEmail && errors.orgPrimaryEmail,
                        )}
                        fullWidth
                        helperText={
                          touched.orgPrimaryEmail && errors.orgPrimaryEmail
                        }
                        label='Primary Contact E-Mail'
                        margin='normal'
                        name='orgPrimaryEmail'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
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
                      disabled={isSubmitting || !isEditing}
                      fullWidth
                      loading={isSubmitting}
                      size='large'
                      sx={{
                        width: '250px',
                      }}
                      type='submit'
                      variant='contained'
                    >
                      Update Organization
                    </LoadingButton>
                  </Box>
                  <Box
                    sx={{ display: 'flex', mt: 2, justifyContent: 'center' }}
                  >
                    {errors.submit && (
                      <Chip
                        label={
                          <FormHelperText error>{errors.submit}</FormHelperText>
                        }
                      />
                    )}
                  </Box>
                </form>
              )}
            </Formik>
          </Box>
        </CardContent>
      </Card>
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
        <Box
          sx={{
            m: 'auto',
          }}
        >
          <OrganizationStackCash />
        </Box>
      </Box>
    </>
  );
};

export default OrganizationDetails;
