import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { TextField as MUITextField } from 'formik-mui';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputAdornment,
  Link,
  ListItemText,
  MenuItem,
  OutlinedInput,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers-pro';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import EventCreate from './EventCreate';
import AssetCreate from './AssetCreate';
import LoadingScreen from 'src/components/LoadingScreen';
import dayjs from 'dayjs';
import { stackrefConfig } from 'src/config';
import Editor from 'src/components/dashboard/Editor';
import { toast } from 'react-toastify';
import ImageUploader from 'src/components/ImageUploader';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';

const EventCreateForm = (props) => {
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState();
  const [cloudAccountsEnabled, setCloudAccountsEnabled] = useState(false);
  const [addAllUsers, setAddAllUsers] = useState(false);
  const [eventType, setEventType] = useState(1);
  const [eventTeamFormMode, setEventTeamFormMode] = useState(1);
  const formRef = useRef();
  const { initializeOrgUsers, orgUsers } = useStackRef();
  const [isLoading, setLoading] = useState(true);
  const [isGeneratingImage, setGeneratingImage] = useState(false);
  const [entityAsset, setEntityAsset] = useState();

  const today = new Date();
  const roundedMinutes = Math.ceil(today.getMinutes() / 15) * 15;
  today.setMinutes(roundedMinutes + 15); // Add 15 minutes to the rounded minutes
  const minDateTime = new Date(today.getTime());
  const [eventStartTs, setEventStartTs] = useState(minDateTime); // Use the rounded and adjusted minDateTime as initial state
  const [eventEndTs, setEventEndTs] = useState(
    new Date(eventStartTs.getTime() + 86400000),
  );

  useEffect(() => {
    async function initialize() {
      await initializeOrgUsers();
      setLoading(false);
    }
    initialize();
  }, [initializeOrgUsers]);

  // Set a default template for the description field
  useEffect(() => {
    const eventDescriptionStr =
      '{"root":{"children":[{"children":[{"detail":0,"format":9,"mode":"normal","style":"","text":"Our Amazing Event","type":"text","version":1}],"direction":"ltr","format":"center","indent":0,"type":"heading","version":1,"tag":"h1"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Describe your event here.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":8,"mode":"normal","style":"","text":"Rules","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","version":1,"tag":"h2"},{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Rule 1","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Rule 2","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":2},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Rule 3","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":3}],"direction":"ltr","format":"","indent":0,"type":"list","version":1,"listType":"number","start":1,"tag":"ol"},{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":8,"mode":"normal","style":"","text":"Prizes & Awards","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading","version":1,"tag":"h2"},{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"1st Place:","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"2nd Place:","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":2},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"3rd Place:","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"listitem","version":1,"value":3}],"direction":"ltr","format":"","indent":0,"type":"list","version":1,"listType":"bullet","start":1,"tag":"ul"}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';
    setEventDescription(eventDescriptionStr);
  }, []);

  const datePickerTheme = createTheme(theme, {
    palette: {
      error: {
        main: theme.palette.primary.main,
      },
    },
  });

  const payload = {};

  const eventTypes = [
    {
      event_type_id: 1,
      event_type_name: 'Standard Hackathon',
    },
  ];

  // TODO: Get these team form modes from the API/database
  const eventTeamFormModes = [
    {
      event_team_form_mode_id: 1,
      event_team_form_mode_name: 'Manual',
      event_team_form_mode_description:
        'Teams are formed manually by an Event administrator',
    },
    {
      event_team_form_mode_id: 2,
      event_team_form_mode_name: 'Automatic',
      event_team_form_mode_description:
        'Teams are formed automatically once an Event starts',
    },
    {
      event_team_form_mode_id: 34,
      event_team_form_mode_name: 'Franchisor',
      event_team_form_mode_description:
        'Participants create their own Teams or choose to join an existing Team',
    },
  ];

  const handleEventDescriptionChange = (event) => {
    const rteContent = JSON.stringify(event);
    rteContent && setEventDescription(rteContent);
  };

  const handleEventNameChange = (event) => {
    console.log(event);
    setEventName(event.target.value);
  };

  const handleCloudAccountsEnabledChange = (event) => {
    setCloudAccountsEnabled((value) => !value);
  };

  const handleAddAllUsersChange = (event) => {
    setAddAllUsers((value) => !value);
  };

  const handleEventTypeChange = (event) => {
    setEventType(event.target.value);
  };

  const handleEventTeamFormModeChange = (event) => {
    setEventTeamFormMode(event.target.value);
  };

  const handleGenerateImage = async (event) => {
    try {
      if (isMountedRef.current) {
        setGeneratingImage(true);

        const payload = {
          user: user,
          action: 'generate_image',
          asset_type: 'banner_image',
          entity_name: eventName,
        };

        await AssetCreate(payload, (response) => {
          if (!response || response.status_code !== 200) {
            throw new Error(
              `${response?.error ? response.error : 'Image generation failed'}`,
            );
          }
          setGeneratingImage(false);
          if (response?.asset_uuid) {
            setEntityAsset(response.asset_uuid);
            toast.success('Image created', { containerId: 'results' });
          } else {
            toast.error('Image generation failed', { containerId: 'results' });
          }
        }).catch((err) => {
          throw err;
        });
      }
    } catch (err) {
      console.error(`>> EventCreateForm: ${err}`);
      if (isMountedRef.current) {
        setGeneratingImage(false);
        toast.error(err.message, { containerId: 'results' });
      }
    }
  };

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Card
      sx={{
        m: 'auto',
        width: { xs: '100%', sm: '80%' },
      }}
    >
      <CardHeader
        title='Create New Event'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <Box
          sx={{
            p: 2,
          }}
        >
          <Typography
            sx={{
              mb: 2,
            }}
          >
            Enter the details of a new event for your organization.
            <br />
            <br />
            Organization StackCash can be provided to the event after it has
            been created, in the &nbsp;
            <Link component={RouterLink} to='/dashboard/admin/events'>
              Admin-&gt;Events
            </Link>
            &nbsp; menu. StackCash can then be distributed to event teams for
            purchase of cloud resources, perks, and more.
          </Typography>
          <Formik
            innerRef={formRef}
            initialValues={{
              eventName: eventName,
              eventSummary: '',
              cloudAccountsEnabled: false,
              addAllUsers: false,
              eventType: 1,
              eventTeamFormMode: 1,
              eventMaxTeamSize: 2,
              eventJudgingMinutes: 60,
              submit: null,
            }}
            validationSchema={Yup.object().shape({
              /*
              eventName: Yup.string()
                .max(50)
                .required('Event name is required')
                .typeError('You must specify a valid Event name'),
              */
              eventSummary: Yup.string()
                .max(500)
                .required('Event summary is required')
                .typeError('You must specify a valid Event summary'),
              eventMaxTeamSize: Yup.number()
                .positive()
                .min(1)
                .max(50)
                .optional()
                .typeError('You must specify a valid Max Team Size'),
              eventJudgingMinutes: Yup.number()
                .positive()
                .min(10)
                .max(1440)
                .typeError('You must specify a valid judging time'),
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
                  payload['event_name'] = eventName;
                  payload['event_summary'] = values.eventSummary;
                  payload['event_description'] = eventDescription;
                  payload['event_judging_minutes'] = values.eventJudgingMinutes;
                  payload['ts_event_start'] = eventStartTs;
                  payload['ts_event_end'] = eventEndTs;
                  payload['cloud_accounts_enabled'] = cloudAccountsEnabled
                    ? 'true'
                    : 'false';
                  payload['add_all_users'] = addAllUsers ? 'true' : 'false';
                  payload['event_type_id'] = eventType;
                  payload['event_team_form_mode_id'] = eventTeamFormMode;
                  payload['event_max_team_size'] = values.eventMaxTeamSize;
                  if (entityAsset) {
                    payload['entity_asset'] =
                      `{\"asset_uuid\":\"${entityAsset}\"}`;
                  }

                  await EventCreate(payload, (response) => {
                    if (!response || response.status_code !== 200) {
                      throw new Error(
                        `${
                          response?.error
                            ? response.error
                            : 'Event create failed'
                        }`,
                      );
                    }
                    setStatus({ success: true });
                    setSubmitting(false);
                    toast.success('Event created', { containerId: 'results' });
                    navigate('/dashboard/admin/events');
                  }).catch((err) => {
                    setStatus({ success: false });
                    setErrors({ submit: err.message });
                    setSubmitting(false);
                    toast.error(err.message, { containerId: 'results' });
                  });
                }
              } catch (err) {
                console.error(`>> EventCreateForm: ${err}`);
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
              setSubmitting,
              setFieldValue,
              setValue,
              touched,
              values,
            }) => (
              <form noValidate onSubmit={handleSubmit} {...props}>
                <Field
                  component={MUITextField}
                  autoFocus
                  error={Boolean(touched.eventName && errors.eventName)}
                  fullWidth
                  helperText={touched.eventName && errors.eventName}
                  inputProps={{ maxLength: 50 }}
                  label='Event Name'
                  margin='normal'
                  name='eventName'
                  onBlur={handleBlur}
                  onChange={handleEventNameChange}
                  required
                  value={eventName}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
                <Field
                  component={MUITextField}
                  error={Boolean(touched.eventSummary && errors.eventSummary)}
                  fullWidth
                  helperText={touched.eventSummary && errors.eventSummary}
                  inputProps={{ maxLength: 500 }}
                  label='Event Summary'
                  margin='normal'
                  name='eventSummary'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  required
                  value={values.eventSummary}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                  }}
                />
                <Box
                  sx={{
                    alignItems: 'center',
                  }}
                >
                  <Typography variant='h6' sx={{ textAlign: 'center' }}>
                    Event Banner
                  </Typography>
                  <Box
                    sx={{
                      '& > button': { m: 1 },
                      alignItems: 'center',
                      display: 'flex',
                      my: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <LoadingButton
                      disabled={
                        isSubmitting || isGeneratingImage || eventName == ''
                      }
                      loadingPosition='start'
                      startIcon={<AddPhotoAlternateRoundedIcon />}
                      loading={isGeneratingImage}
                      onClick={handleGenerateImage}
                      variant='contained'
                      sx={{ mx: 3 }}
                    >
                      <Box>
                        {isGeneratingImage
                          ? 'Generating Image…'
                          : 'Generate One For Me'}
                      </Box>
                    </LoadingButton>
                    <Typography>... or upload one below</Typography>
                  </Box>
                  <ImageUploader
                    assetType='banner_image'
                    assetUuid={entityAsset}
                    entityUuid={user.organization_uuid}
                    isSubmitting={isSubmitting || isGeneratingImage}
                    setEntityAsset={setEntityAsset}
                    setSubmitting={setSubmitting}
                  />
                </Box>
                <Box>
                  <Editor
                    onChange={handleEventDescriptionChange}
                    editable={!isSubmitting}
                    //placeholderText='Event Description'
                    editorState={eventDescription || null}
                  />
                </Box>
                <Box
                  sx={{
                    mt: 2,
                  }}
                >
                  <Typography
                    color='text.secondary'
                    sx={{
                      my: 2,
                    }}
                  >
                    Events can be a maximum of two (2) weeks in duration
                  </Typography>
                  <Grid container spacing={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <ThemeProvider theme={datePickerTheme}>
                        <Grid item>
                          <DateTimePicker
                            disabled={isSubmitting}
                            label='Event Start'
                            name='eventStartTs'
                            //value={values.eventStartTs}
                            value={eventStartTs}
                            format='yyyy/MM/dd hh:mm a'
                            mask='____/__/__ __:__ _M'
                            minDateTime={minDateTime}
                            minutesStep={15}
                            required
                            onError={console.log}
                            onChange={(val) => {
                              setEventStartTs(val);
                              if (eventEndTs < val)
                                setEventEndTs(
                                  new Date(dayjs(val).add(1, 'week')),
                                );
                            }}
                            sx={{
                              width: '245px',
                            }}
                          />
                        </Grid>
                        <Grid item>
                          <DateTimePicker
                            disabled={isSubmitting}
                            label='Event End'
                            name='eventEndTs'
                            value={
                              eventEndTs > eventStartTs
                                ? eventEndTs
                                : new Date(dayjs(eventStartTs).add(1, 'week'))
                            }
                            format='yyyy/MM/dd hh:mm a'
                            mask='____/__/__ __:__ _M'
                            minDateTime={eventStartTs}
                            maxDateTime={
                              new Date(dayjs(eventStartTs).add(2, 'week'))
                            }
                            minutesStep={15}
                            required
                            onError={console.log}
                            onChange={(val) => {
                              setEventEndTs(val);
                            }}
                            sx={{
                              width: '245px',
                            }}
                          />
                        </Grid>
                      </ThemeProvider>
                    </LocalizationProvider>
                    <Grid item>
                      <Field
                        component={MUITextField}
                        disabled={isSubmitting}
                        autoFocus
                        error={Boolean(
                          touched.eventJudgingMinutes &&
                            errors.eventJudgingMinutes,
                        )}
                        helperText={
                          touched.eventJudgingMinutes &&
                          errors.eventJudgingMinutes
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              minutes
                            </InputAdornment>
                          ),
                          inputProps: { min: '10', max: '1440', step: '10' },
                        }}
                        label='Judging Time'
                        margin='normal'
                        name='eventJudgingMinutes'
                        onBlur={handleBlur}
                        onChange={handleChange}
                        type='number'
                        value={values.eventJudgingMinutes}
                        variant='outlined'
                        sx={{
                          input: { color: 'text.primary' },
                          marginTop: 0,
                          maxWidth: '150px',
                          width: '150px',
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3 }}>
                    <FormGroup>
                      {stackrefConfig.uiEnvironment !== 'beta' && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              name='cloudAccountsEnabled'
                              checked={cloudAccountsEnabled}
                              onChange={(event) => {
                                handleChange(event);
                                handleCloudAccountsEnabledChange(event);
                              }}
                            />
                          }
                          label={
                            <Typography color='textPrimary'>
                              Cloud accounts enabled
                            </Typography>
                          }
                        />
                      )}
                      <FormControlLabel
                        control={
                          <Checkbox
                            name='addAllUsers'
                            checked={addAllUsers}
                            onChange={(event) => {
                              handleChange(event);
                              handleAddAllUsersChange(event);
                            }}
                          />
                        }
                        label={
                          <Typography color='textPrimary'>
                            Add all{' '}
                            {orgUsers?.length > 0 && orgUsers.length + ' '}
                            organization users as participants
                          </Typography>
                        }
                      />
                    </FormGroup>
                  </Box>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      mt: 3,
                    }}
                  >
                    <Grid item>
                      <TextField
                        disabled={isSubmitting}
                        select
                        size='small'
                        id='event-type'
                        label='Event Type'
                        required
                        value={eventType}
                        onChange={handleEventTypeChange}
                        input={<OutlinedInput />}
                      >
                        {eventTypes.map((eventType) => {
                          return (
                            <MenuItem
                              key={eventType.event_type_id + '_dialog'}
                              label={eventType.event_type_name}
                              value={eventType.event_type_id}
                            >
                              <ListItemText
                                primary={eventType.event_type_name}
                              />
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </Grid>
                    <Grid item>
                      <TextField
                        disabled={isSubmitting}
                        select
                        size='small'
                        id='event-team-form-mode'
                        label='Team Formation Mode'
                        required
                        value={eventTeamFormMode}
                        onChange={handleEventTeamFormModeChange}
                        input={<OutlinedInput />}
                        sx={{
                          minWidth: 200,
                        }}
                      >
                        {eventTeamFormModes.map((eventTeamFormMode) => {
                          return (
                            <MenuItem
                              key={
                                eventTeamFormMode.event_team_form_mode_id +
                                '_dialog'
                              }
                              label={
                                eventTeamFormMode.event_team_form_mode_name
                              }
                              value={eventTeamFormMode.event_team_form_mode_id}
                            >
                              <ListItemText
                                primary={
                                  eventTeamFormMode.event_team_form_mode_name
                                }
                                secondary={
                                  eventTeamFormMode.event_team_form_mode_description
                                }
                              />
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </Grid>
                    <Grid item>
                      {eventTeamFormMode === 2 && (
                        <Field
                          component={MUITextField}
                          disabled={isSubmitting}
                          autoFocus
                          error={Boolean(
                            touched.eventMaxTeamSize && errors.eventMaxTeamSize,
                          )}
                          helperText={
                            touched.eventMaxTeamSize && errors.eventMaxTeamSize
                          }
                          InputProps={{
                            inputProps: { min: '1', max: '50', step: '1' },
                          }}
                          label='Maximum Team Size'
                          margin='normal'
                          name='eventMaxTeamSize'
                          onBlur={handleBlur}
                          onChange={handleChange}
                          type='number'
                          value={values.eventMaxTeamSize}
                          variant='outlined'
                          sx={{
                            input: { color: 'text.primary' },
                            marginTop: 0,
                            maxWidth: '150px',
                            width: '150px',
                          }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ display: 'flex', mt: 2 }}>
                  <LoadingButton
                    color='primary'
                    disabled={
                      isSubmitting || isGeneratingImage || eventName == ''
                    }
                    loading={isSubmitting}
                    size='large'
                    sx={{
                      mx: 'auto',
                    }}
                    type='submit'
                    variant='contained'
                  >
                    Create Event
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
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCreateForm;
