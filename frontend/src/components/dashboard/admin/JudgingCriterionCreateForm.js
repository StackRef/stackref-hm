import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { TextField as MUITextField } from 'formik-mui';
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
  OutlinedInput,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import JudgingCriterionCreate from './JudgingCriterionCreate';
import { useTheme } from '@mui/material/styles';
import StarRateIcon from '@mui/icons-material/StarRate';
import { useDispatch } from 'src/store';
import { getJudgingCriteria } from 'src/slices/judgingCriteria';

const JudgingCriterionCreateForm = (props) => {
  const { eventUuid, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [criterionCategory, setCriterionCategory] = useState(1);
  const theme = useTheme();
  const dispatch = useDispatch();

  // TODO: Get these from a call to the API to pull from the DB
  const criterionCategories = [
    {
      judging_criterion_category_id: 1,
      judging_criterion_category_name: 'Other',
    },
    {
      judging_criterion_category_id: 2,
      judging_criterion_category_name: 'Performance',
    },
    {
      judging_criterion_category_id: 3,
      judging_criterion_category_name: 'Cost',
    },
    {
      judging_criterion_category_id: 4,
      judging_criterion_category_name: 'Feasibility',
    },
    {
      judging_criterion_category_id: 5,
      judging_criterion_category_name: 'Teamwork',
    },
    {
      judging_criterion_category_id: 6,
      judging_criterion_category_name: 'Presentation',
    },
    {
      judging_criterion_category_id: 7,
      judging_criterion_category_name: 'Innovation',
    },
  ];

  const handleCriterionCategoryChange = (event) => {
    setCriterionCategory(event.target.value);
  };

  const payload = {};

  return (
    <Card
      sx={{
        m: 'auto',
        width: '80%',
      }}
    >
      <CardHeader
        title='New Judging Criterion'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <Formik
          initialValues={{
            eventUuid: eventUuid,
            criterionName: '',
            criterionSummary: '',
            criterionDescription: '',
            criterionWeight: 1,
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            criterionName: Yup.string()
              .max(50)
              .required('Criterion name is required')
              .typeError('You must specify a valid Criterion name'),
            criterionSummary: Yup.string()
              .max(1000)
              .required('Criterion summary is required')
              .typeError('You must specify a valid Criterion summary'),
            criterionWeight: Yup.number()
              .min(1)
              .max(1000)
              .required('Criterion default weight is required')
              .typeError('You must specify a valid Criterion default weight'),
          })}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
            try {
              if (isMountedRef.current) {
                payload['user'] = user;
                payload['action'] = 'create';
                payload['event_uuid'] = values.eventUuid;
                payload['criterion_name'] = values.criterionName;
                payload['criterion_summary'] = values.criterionSummary;
                payload['criterion_description'] = values.criterionDescription;
                payload['criterion_weight'] = parseInt(values.criterionWeight);
                payload['category_id'] = criterionCategory;

                await JudgingCriterionCreate(payload, (response) => {
                  if (!response || response.status_code !== 200)
                    throw new Error('Criterion create failed');
                })
                  .then(() => {
                    setStatus({ success: true });
                    dispatch(
                      getJudgingCriteria({ user: user, eventUuid: eventUuid }),
                    );
                    setSubmitting(false);
                    toast.success('Criterion created', {
                      containerId: 'results',
                    });
                    navigate(`/dashboard/admin/events/${values.eventUuid}`);
                  })
                  .catch((err) => {
                    setStatus({ success: false });
                    setErrors({ submit: err.message });
                    setSubmitting(false);
                    toast.error(err.message, { containerId: 'results' });
                  });
              }
            } catch (err) {
              console.error(`>> JudgingCriterionCreateForm: ${err}`);
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
            setFieldValue,
            setValue,
            touched,
            values,
          }) => (
            <form noValidate onSubmit={handleSubmit} {...other}>
              <Grid container spacing={2}>
                <Grid item>
                  <TextField
                    size='small'
                    select
                    required
                    id='criterion-category'
                    label='Category'
                    value={criterionCategory}
                    onChange={handleCriterionCategoryChange}
                    input={<OutlinedInput />}
                    sx={{
                      mt: 2,
                    }}
                  >
                    {criterionCategories.map((criterionCategory) => {
                      return (
                        <MenuItem
                          key={
                            criterionCategory.judging_criterion_category_id +
                            '_dialog'
                          }
                          label={
                            criterionCategory.judging_criterion_category_name
                          }
                          value={
                            criterionCategory.judging_criterion_category_id
                          }
                        >
                          <ListItemText
                            primary={
                              criterionCategory.judging_criterion_category_name
                            }
                          />
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
                <Grid item xs={8}>
                  <Field
                    autoFocus
                    component={MUITextField}
                    error={Boolean(
                      touched.criterionName && errors.criterionName,
                    )}
                    fullWidth
                    helperText={touched.criterionName && errors.criterionName}
                    label='Criterion Name'
                    margin='normal'
                    name='criterionName'
                    onBlur={handleBlur}
                    onChange={handleChange}
                    required
                    value={values.criterionName}
                    variant='outlined'
                    sx={{
                      input: { color: 'text.primary' },
                    }}
                  />
                </Grid>
              </Grid>
              <Field
                component={MUITextField}
                error={Boolean(
                  touched.criterionSummary && errors.criterionSummary,
                )}
                fullWidth
                helperText={touched.criterionSummary && errors.criterionSummary}
                label='Criterion Summary'
                margin='normal'
                name='criterionSummary'
                onBlur={handleBlur}
                onChange={handleChange}
                required
                value={values.criterionSummary}
                variant='outlined'
                sx={{
                  input: { color: 'text.primary' },
                }}
              />
              <Field
                component={MUITextField}
                error={Boolean(
                  touched.criterionDescription && errors.criterionDescription,
                )}
                fullWidth
                multiline
                minRows={2}
                helperText={
                  touched.criterionDescription && errors.criterionDescription
                }
                label='Criterion Description'
                margin='normal'
                name='criterionDescription'
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.criterionDescription}
                variant='outlined'
                sx={{
                  textarea: { color: 'text.primary' },
                }}
              />
              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <Field
                    inputProps={{ inputMode: 'numeric', pattern: '[1-9]*' }}
                    component={MUITextField}
                    type='number'
                    error={Boolean(
                      touched.criterionWeight && errors.criterionWeight,
                    )}
                    helperText={
                      touched.criterionWeight && errors.criterionWeight
                    }
                    label='Weight'
                    margin='normal'
                    name='criterionWeight'
                    onBlur={handleBlur}
                    onChange={handleChange}
                    required
                    value={values.criterionWeight}
                    variant='outlined'
                    sx={{
                      input: { color: 'text.primary' },
                    }}
                  />
                </Grid>
                <Grid item>
                  <Box
                    sx={{
                      alignItems: 'center',
                      height: '100%',
                      display: 'flex',
                    }}
                  >
                    <Typography
                      sx={{
                        verticalAlign: 'middle',
                      }}
                    >
                      Criterion weights are applied to judging{' '}
                      <StarRateIcon
                        sx={{ color: 'gold', verticalAlign: 'middle' }}
                      />{' '}
                      scores
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex' }}>
                <LoadingButton
                  color='primary'
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  size='large'
                  sx={{
                    mx: 'auto',
                  }}
                  type='submit'
                  variant='contained'
                >
                  Create Judging Criterion
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
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default JudgingCriterionCreateForm;
