import { useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import useAuth from 'src/hooks/useAuth';
import GetUserTags from 'src/components/stackref/GetUserTags';
import PhoneNumber from 'src/components/PhoneNumber';
import PhoneInput from 'react-phone-number-input/input';
import { useTheme } from '@mui/material/styles';

const AccountGeneralSettings = (props) => {
  const { user, updateUser } = useAuth();
  const [userSkillTags, setUserSkillTags] = useState();
  const [userSkillTagOptions, setUserSkillTagOptions] = useState([]);
  const isMountedRef = useIsMountedRef();
  const [isEditing, setEditing] = useState(false);
  const theme = useTheme();

  const handleUserSkillTagsChange = (event, values) => {
    setUserSkillTags(values);
    setEditing(true);
  };

  const handleFieldChange = () => {
    setEditing(true);
  };

  const getUserSkillTagOptions = useCallback(async () => {
    console.log(':: getSkillTagOptions');
    try {
      await GetUserTags(user)
        .then((data) => {
          const skillTags = data
            .filter((tag) => tag.user_tag_type === 'skill')
            .map((tag) => tag.user_tag_name);
          setUserSkillTagOptions(skillTags);
        })
        .catch((err) => {
          throw new Error(err);
        });
    } catch (err) {
      console.error(`>> getSkillTagOptions: ${err}`);
    }
  }, [user]);

  useEffect(() => {
    getUserSkillTagOptions();
  }, [getUserSkillTagOptions]);

  useEffect(() => {
    setUserSkillTags(user?.tags?.skills);
  }, [user]);

  return (
    <Grid container spacing={3} {...props}>
      <Grid item lg={4} md={6} xl={3} xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  p: 1,
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  borderRadius: '50%',
                }}
              >
                <Avatar
                  src={user.avatar}
                  sx={{
                    height: 100,
                    width: 100,
                  }}
                />
              </Box>
              <Typography
                color='textPrimary'
                sx={{ mt: 1 }}
                variant='subtitle2'
              >
                {user.first_name} {user.last_name}
              </Typography>
              <Typography
                color='textSecondary'
                sx={{ mt: 1 }}
                variant='subtitle2'
              >
                {user.job_title}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                Your organization: {user.organization_name}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={8} md={6} xl={9} xs={12}>
        <Formik
          enableReinitialize
          initialValues={{
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            emailAddress: user.email || '',
            phoneNumber: user.phone || '',
            jobTitle: user.job_title || '',
            userSkillTags: userSkillTags,
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            emailAddress: Yup.string()
              .email('Must be a valid email')
              .max(255)
              .required('Email is required'),
            firstName: Yup.string().max(255).required('First name is required'),
            lastName: Yup.string().max(255).required('Last name is required'),
            jobTitle: Yup.string()
              .typeError('You must enter a valid string')
              .max(255),
            phoneNumber: Yup.string()
              .max(25)
              .typeError('You must specify a valid phone number'),
          })}
          onSubmit={async (
            values,
            { resetForm, setErrors, setStatus, setSubmitting },
          ) => {
            try {
              if (isMountedRef.current) {
                setSubmitting(true);
                setEditing(false);

                const payload = {};
                payload['user'] = user;
                payload['action'] = 'update';
                payload['user_payload'] = {
                  user_uuid: user.user_uuid,
                  first_name: values.firstName,
                  last_name: values.lastName,
                  email: values.emailAddress,
                  phone: values.phoneNumber || '',
                  job_title: values.jobTitle,
                };
                payload['tags'] = {
                  skills: values.userSkillTags,
                };
                await updateUser(payload);
                // TODO: We should check response code from above to ensure success first
                setStatus({ success: true });
                setSubmitting(false);
                setEditing(false);
                toast.success('User details updated', {
                  containerId: 'results',
                });
              }
            } catch (err) {
              console.error(`>> UserEdit: ${err}`);
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
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader
                  title='Profile'
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.background.paper,
                    py: 1,
                  }}
                />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(touched.firstName && errors.firstName)}
                        fullWidth
                        helperText={touched.firstName && errors.firstName}
                        label='First name'
                        name='firstName'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
                        required
                        value={values.firstName}
                        variant='outlined'
                        sx={{
                          color: '#fff',
                          display: 'flex',
                        }}
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(touched.lastName && errors.lastName)}
                        fullWidth
                        helperText={touched.lastName && errors.lastName}
                        label='Last name'
                        name='lastName'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
                        required
                        value={values.lastName}
                        variant='outlined'
                        sx={{
                          color: '#fff',
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        error={Boolean(
                          touched.emailAddress && errors.emailAddress,
                        )}
                        fullWidth
                        helperText={touched.emailAddress && errors.emailAddress}
                        label='Email Address'
                        name='emailAddress'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
                        required
                        type='email'
                        value={values.emailAddress}
                        variant='outlined'
                        sx={{
                          color: '#fff',
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <PhoneInput
                        country='US'
                        placeholder='Phone Number'
                        value={values.phoneNumber}
                        name='phoneNumber'
                        onChange={(event) => {
                          values.phoneNumber = event;
                          handleFieldChange();
                        }}
                        inputComponent={PhoneNumber}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        error={Boolean(touched.jobTitle && errors.jobTitle)}
                        fullWidth
                        label='Job Title'
                        name='jobTitle'
                        onBlur={handleBlur}
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
                        value={values.jobTitle}
                        variant='outlined'
                        sx={{
                          color: '#fff',
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      mt: 2,
                    }}
                  >
                    <Autocomplete
                      multiple
                      id='tags-outlined'
                      options={userSkillTagOptions}
                      getOptionLabel={(option) => option}
                      value={userSkillTags ? userSkillTags : []}
                      filterSelectedOptions
                      onChange={handleUserSkillTagsChange}
                      renderInput={(params) => (
                        <TextField {...params} label='Skills' />
                      )}
                    />
                  </Box>
                </CardContent>
                <Divider />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 2,
                  }}
                >
                  <LoadingButton
                    color='primary'
                    disabled={isSubmitting || !isEditing}
                    loading={isSubmitting}
                    type='submit'
                    variant='contained'
                  >
                    Save Changes
                  </LoadingButton>
                </Box>
                <Box sx={{ display: 'flex', mt: 2, justifyContent: 'center' }}>
                  {errors.submit && (
                    <Chip
                      label={
                        <FormHelperText error>{errors.submit}</FormHelperText>
                      }
                    />
                  )}
                </Box>
              </Card>
            </form>
          )}
        </Formik>
      </Grid>
    </Grid>
  );
};

export default AccountGeneralSettings;
