import { useState } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { TextField as MUITextField } from 'formik-mui';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Chip,
  FormHelperText,
  Grid,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import JudgingCriterionEdit from './JudgingCriterionEdit';
import StarRateIcon from '@mui/icons-material/StarRate';

// category icons
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CoPresentRoundedIcon from '@mui/icons-material/CoPresentRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';

const categoryIcons = {
  other: BusinessCenterRoundedIcon,
  performance: InsertChartRoundedIcon,
  cost: AttachMoneyRoundedIcon,
  feasibility: QuestionMarkRoundedIcon,
  teamwork: GroupsRoundedIcon,
  presentation: CoPresentRoundedIcon,
  innovation: LightbulbRoundedIcon,
};

const JudgingCriterionEditForm = (props) => {
  const { judgingCriterion, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [criterionCategory, setCriterionCategory] = useState(
    judgingCriterion.judging_criterion_category_id,
  );
  const orgEvent = useSelector((state) => state.orgEvent);

  const handleCriterionCategoryChange = (event) => {
    setCriterionCategory(event.target.value);
  };

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
          Edit Judging Criterion
        </Typography>
      </Box>
      <Formik
        initialValues={{
          eventUuid: judgingCriterion.event_uuid,
          criterionUuid: judgingCriterion.judging_criterion_uuid,
          criterionName:
            judgingCriterion.criterion_details.criterion_name || '',
          criterionSummary:
            judgingCriterion.criterion_details.criterion_summary || '',
          criterionDescription:
            judgingCriterion.criterion_details.criterion_description || '',
          criterionWeight: judgingCriterion.criterion_weight || 0,
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          criterionName: Yup.string()
            .max(50)
            .required('Criterion name is required')
            .typeError('You must specify a valid Criterion name'),
          criterionSummary: Yup.string()
            .max(500)
            .required('Criterion summary is required')
            .typeError('You must specify a valid Criterion summary'),
          criterionWeight: Yup.number()
            .min(1)
            .max(1000)
            .required('Criterion weight is required')
            .typeError('You must specify a valid Criterion weight'),
        })}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            if (isMountedRef.current) {
              const payload = {};
              payload['user'] = user;
              payload['action'] = 'update';
              payload['event_uuid'] = values.eventUuid;
              payload['judging_criterion_uuid'] = values.criterionUuid;
              payload['criterion_name'] = values.criterionName;
              payload['criterion_summary'] = values.criterionSummary;
              payload['criterion_description'] = values.criterionDescription;
              payload['criterion_weight'] = parseInt(values.criterionWeight);
              payload['category_id'] = criterionCategory;

              await JudgingCriterionEdit(payload, (response) => {
                if (!response || response.status_code !== 200)
                  throw new Error('Criterion update failed');
              })
                .then(async () => {
                  setStatus({ success: true });
                  setSubmitting(false);
                  toast.success('Criterion updated', {
                    containerId: 'results',
                  });
                })
                .catch((error) => {
                  setStatus({ success: false });
                  setErrors({ submit: error.message });
                  setSubmitting(false);
                  toast.error(error.message, { containerId: 'results' });
                });
            }
          } catch (error) {
            console.error(`>> JudgingCriterionEditForm: ${error}`);
            if (isMountedRef.current) {
              setStatus({ success: false });
              setErrors({ submit: error.message });
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
            <TextField
              select
              required
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
              id='criterion-category'
              label='Category'
              value={criterionCategory}
              onChange={handleCriterionCategoryChange}
              sx={{
                mt: 2,
              }}
            >
              {judgingCriterion?.judging_criterion_categories?.map(
                (criterionCategory) => {
                  const CriterionCategoryIcon =
                    categoryIcons[
                      criterionCategory.judging_criterion_category_icon
                    ] || BusinessCenterRoundedIcon;
                  return (
                    <MenuItem
                      disabled={
                        isSubmitting ||
                        ['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        )
                      }
                      key={
                        criterionCategory.judging_criterion_category_id +
                        '_dialog'
                      }
                      label={criterionCategory.judging_criterion_category_name}
                      value={criterionCategory.judging_criterion_category_id}
                    >
                      <ListItemIcon>
                        <CriterionCategoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          criterionCategory.judging_criterion_category_name
                        }
                        // TODO: This needs to be figured out to be cleaner
                        sx={{
                          mt: '-28px',
                          ml: '30px',
                        }}
                      />
                    </MenuItem>
                  );
                },
              )}
            </TextField>
            <Field
              required
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
              component={MUITextField}
              autoFocus
              error={Boolean(touched.criterionName && errors.criterionName)}
              fullWidth
              helperText={touched.criterionName && errors.criterionName}
              label='Criterion Name'
              margin='normal'
              name='criterionName'
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.criterionName}
              variant='outlined'
              sx={{
                input: { color: 'text.primary' },
              }}
            />
            <Field
              required
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
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
              value={values.criterionSummary}
              variant='outlined'
              sx={{
                input: { color: 'text.primary' },
              }}
            />
            <Field
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
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
              <Grid item>
                <Field
                  required
                  disabled={
                    isSubmitting ||
                    ['Complete', 'Archived'].includes(
                      orgEvent.data.event_status_name,
                    )
                  }
                  inputProps={{ inputMode: 'numeric', pattern: '[1-9]*' }}
                  component={MUITextField}
                  type='number'
                  error={Boolean(
                    touched.criterionWeight && errors.criterionWeight,
                  )}
                  helperText={touched.criterionWeight && errors.criterionWeight}
                  label='Weight'
                  margin='normal'
                  name='criterionWeight'
                  onBlur={handleBlur}
                  onChange={handleChange}
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
                      color: 'text.primary',
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
            <Box sx={{ mx: 5, my: 2 }}>
              <Button
                color='primary'
                disabled={
                  isSubmitting ||
                  ['Complete', 'Archived'].includes(
                    orgEvent.data.event_status_name,
                  )
                }
                fullWidth
                size='large'
                type='submit'
                variant='contained'
              >
                Edit Criterion
              </Button>
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

export default JudgingCriterionEditForm;
