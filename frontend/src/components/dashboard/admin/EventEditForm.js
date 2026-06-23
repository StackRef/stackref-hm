import { useEffect, useMemo, useState } from 'react';
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
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputAdornment,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Skeleton,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers-pro';
import useAuth from 'src/hooks/useAuth';
import EventEdit from './EventEdit';
import useStackRef from 'src/hooks/useStackRef';
import CoinBankTransaction from './CoinBankTransaction';
import { dtmFormatted, dtmFormattedUtc } from 'src/utils/dtmFormatting';
import dayjs from 'dayjs';
import { stackrefConfig } from 'src/config';
import Editor from 'src/components/dashboard/Editor';
import { useConfirm } from 'material-ui-confirm';
import ImageUploader from 'src/components/ImageUploader';
import { useDispatch, useSelector } from 'src/store';
import { getOrgEvent } from 'src/slices/orgEvent';

const EventEditForm = (props) => {
  const { ...other } = props;
  const orgEvent = useSelector((state) => state.orgEvent);
  const { initializeOrganization, initializeOrgEvents, organization } =
    useStackRef();
  const [eventCoinBalance, setEventCoinBalance] = useState(0);
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [eventStartTs, setEventStartTs] = useState(
    orgEvent.data.ts_event_start
      ? new Date(dtmFormatted(orgEvent.data.ts_event_start))
      : null,
  );
  const [eventEndTs, setEventEndTs] = useState(
    orgEvent.data.ts_event_end
      ? new Date(dtmFormatted(orgEvent.data.ts_event_end))
      : null,
  );
  const [orgCoinBalance, setOrgCoinBalance] = useState(
    organization?.bank_balance,
  );
  const [coinValue, setCoinValue] = useState(orgEvent.data.bank_balance);
  const [isLoading, setLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState(orgEvent.data.event_status_id);
  const [newEventDescription, setNewEventDescription] = useState();
  const [cloudAccountsEnabled, setCloudAccountsEnabled] = useState(false);
  const [eventType, setEventType] = useState(orgEvent.data.event_type_id);
  const [eventTeamFormMode, setEventTeamFormMode] = useState(
    orgEvent.data.event_team_form_mode_id,
  );
  const theme = useTheme();
  const [isEditing, setEditing] = useState(false);
  const [entityAsset, setEntityAsset] = useState();
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const today = new Date();
  const roundedMinutes = Math.ceil(today.getMinutes() / 15) * 15;
  today.setMinutes(roundedMinutes + 15); // Add 15 minutes to the rounded minutes
  const minDateTime = new Date(today.getTime());

  useEffect(() => {
    setEventStartTs(
      orgEvent.data.ts_event_start
        ? new Date(dtmFormatted(orgEvent.data.ts_event_start))
        : null,
    );
    setEventEndTs(
      orgEvent.data.ts_event_end
        ? new Date(dtmFormatted(orgEvent.data.ts_event_end))
        : null,
    );
  }, [orgEvent]);

  const datePickerTheme = createTheme(theme, {
    palette: {
      error: {
        main: theme.palette.primary.main,
      },
    },
  });

  const originalEventDescription = useMemo(() => {
    let content =
      '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';
    if (orgEvent.data.event_details?.event_description?.includes('root')) {
      content = orgEvent.data.event_details.event_description;
    }
    setNewEventDescription(content);
    return content;
  }, [orgEvent]);

  // TODO: Get these from a call to the API to pull from the DB
  const eventStatuses = [
    {
      event_status_id: 1,
      event_status_name: 'Not Ready',
      restricted: true,
    },
    {
      event_status_id: 2,
      event_status_name: 'Ready',
      restricted: true,
    },
    {
      event_status_id: 3,
      event_status_name: 'Running',
    },
    {
      event_status_id: 34,
      event_status_name: 'Judging',
    },
    {
      event_status_id: 4,
      event_status_name: 'Complete',
    },
    {
      event_status_id: 5,
      event_status_name: 'Hold',
      restricted: true,
    },
    {
      event_status_id: 6,
      event_status_name: 'Archived',
      restricted: true,
      disabled: true,
    },
  ];

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

  useEffect(() => {
    initializeOrganization();
  }, [initializeOrganization]);

  useEffect(() => {
    async function initialize() {
      setEventCoinBalance(orgEvent.data.bank_balance);
      setCoinValue(orgEvent.data.bank_balance);
      setCloudAccountsEnabled(orgEvent.data.cloud_accounts_enabled || false);
      setLoading(false);
    }
    initialize();
  }, [orgEvent]);

  useEffect(() => {
    setOrgCoinBalance(organization?.bank_balance);
  }, [organization]);

  const handleFieldChange = () => {
    setEditing(true);
  };

  const handleCoinSliderChange = (event, newValue) => {
    setCoinValue(newValue);
    setEditing(true);
  };

  const handleCoinInputChange = (event) => {
    setCoinValue(event.target.value === '' ? '' : Number(event.target.value));
    setEditing(true);
  };

  const handleCoinSliderBlur = () => {
    if (coinValue < 0) {
      setCoinValue(0);
    } else if (coinValue > organization?.bank_balance + eventCoinBalance) {
      setCoinValue(organization?.bank_balance + eventCoinBalance);
    }
  };

  const UpdateEventCoinBalance = async () => {
    console.log(':: UpdateEventCoinBalance');
    try {
      if (isMountedRef.current) {
        const payload = {};
        payload['user'] = user;
        payload['action'] = 'transaction';

        // If we are dropping the value, take from Event and give to Org
        // If we are increasing the value, take from org and give to Event
        if (coinValue > eventCoinBalance) {
          payload['sending_entity_uuid'] = user.organization_uuid;
          payload['receiving_entity_uuid'] = orgEvent.data.event_uuid;
          payload['transaction_value'] = Number(coinValue - eventCoinBalance);
        } else {
          payload['sending_entity_uuid'] = orgEvent.data.event_uuid;
          payload['receiving_entity_uuid'] = user.organization_uuid;
          payload['transaction_value'] = Number(eventCoinBalance - coinValue);
        }

        await CoinBankTransaction(payload, (response) => {
          if (!response || response.status_code !== 200)
            throw new Error('Coin transaction failed');
          if (coinValue > eventCoinBalance) {
            setEventCoinBalance(response.bank_balances?.receiver_coin_balance);
            setOrgCoinBalance(response.bank_balances?.sender_coin_balance);
          } else {
            setEventCoinBalance(response.bank_balances?.sender_coin_balance);
            setOrgCoinBalance(response.bank_balances?.receiver_coin_balance);
          }
        }).catch((error) => {
          throw error;
        });
      }
    } catch (error) {
      toast.error(error.message, { containerId: 'results' });
      setEditing(false);
      console.error(`>> UpdateEventCoinBalance: ${error}`);
    }
  };

  const handleEventStatusChange = (event) => {
    setEventStatus(event.target.value);
    setEditing(true);
  };

  const handleEventTypeChange = (event) => {
    setEventType(event.target.value);
    setEditing(true);
  };

  const handleEventTeamFormModeChange = (event) => {
    setEventTeamFormMode(event.target.value);
    setEditing(true);
  };

  const handleEventDescriptionChange = async (event) => {
    const rteContent = JSON.stringify(event);
    newEventDescription && setEditing(true);
    rteContent && setNewEventDescription(rteContent);
    setEditing(true);
  };

  const handleCloudAccountsEnabledChange = (event) => {
    setCloudAccountsEnabled((value) => !value);
  };

  return (
    <Card
      sx={{
        m: 'auto',
        width: '80%',
      }}
    >
      <CardHeader
        title='Edit Event'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <Formik
          initialValues={{
            eventUuid: orgEvent.data.event_uuid,
            eventName: orgEvent.data.event_details?.event_name || '',
            eventSummary: orgEvent.data.event_details?.event_summary || '',
            cloudAccountsEnabled: orgEvent.data.cloud_accounts_enabled || false,
            eventType: orgEvent.data.event_type_id || 1,
            eventTeamFormMode: orgEvent.data.event_team_form_mode_id || 1,
            eventMaxTeamSize: orgEvent.data.event_details?.event_max_team_size,
            eventJudgingMinutes: orgEvent.data.event_judging_minutes || 60,
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            eventName: Yup.string()
              .max(50)
              .required('Event name is required')
              .typeError('You must specify a valid Event name'),
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
          onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
            try {
              if (isMountedRef.current) {
                const payload = {};
                payload['user'] = user;
                payload['action'] = 'update';
                payload['event_uuid'] = values.eventUuid;
                payload['event_name'] = values.eventName;
                payload['event_status'] = eventStatus;
                payload['event_summary'] = values.eventSummary;
                payload['event_description'] = newEventDescription;
                payload['event_judging_minutes'] = values.eventJudgingMinutes;
                payload['ts_event_start'] = dtmFormattedUtc(eventStartTs);
                payload['ts_event_end'] = dtmFormattedUtc(eventEndTs);
                payload['cloud_accounts_enabled'] = cloudAccountsEnabled
                  ? 'true'
                  : 'false';
                payload['event_type_id'] = eventType;
                payload['event_team_form_mode_id'] = eventTeamFormMode;
                payload['event_max_team_size'] =
                  values.eventMaxTeamSize || undefined;

                await EventEdit(payload, async (error, response) => {
                  if (error) {
                    throw `Event update failed: ${error.error}`;
                  }
                }).catch((error) => {
                  throw error;
                });
                if (
                  typeof coinValue !== 'undefined' &&
                  coinValue !== eventCoinBalance
                ) {
                  await UpdateEventCoinBalance();
                }
                initializeOrganization();
                initializeOrgEvents();
                dispatch(
                  getOrgEvent({ user: user, eventUuid: values.eventUuid }),
                );
                setStatus({ success: true });
                setSubmitting(false);
                setEditing(false);
                toast.success('Event updated', { containerId: 'results' });
              }
            } catch (error) {
              console.error(`>> EventEditForm: ${error}`);
              if (isMountedRef.current) {
                toast.error(error, { containerId: 'results' });
                setStatus({ success: false });
                setErrors({ submit: error });
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
            setSubmitting,
            setFieldValue,
            setValue,
            touched,
            values,
          }) => (
            <form noValidate onSubmit={handleSubmit} {...other}>
              <Grid
                container
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justify: 'flex-end',
                }}
              >
                <Grid item xs={12} md={9}>
                  <Field
                    disabled={
                      isSubmitting ||
                      ['Judging', 'Complete', 'Archived'].includes(
                        orgEvent.data.event_status_name,
                      )
                    }
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
                    onChange={(event) => {
                      handleChange(event);
                      handleFieldChange();
                    }}
                    required
                    value={values.eventName}
                    variant='outlined'
                    sx={{
                      input: { color: 'text.primary' },
                    }}
                  />
                </Grid>
                <Grid item xs={4} md={3}>
                  <TextField
                    disabled={
                      isSubmitting ||
                      ['Complete', 'Archived'].includes(
                        orgEvent.data.event_status_name,
                      ) ||
                      (['Running', 'Judging'].includes(
                        orgEvent.data.event_status_name,
                      ) &&
                        eventStatus.restricted)
                    }
                    select
                    size='small'
                    id='event-status'
                    label='Status'
                    required
                    value={eventStatus}
                    onChange={handleEventStatusChange}
                    input={<OutlinedInput />}
                    sx={{ display: 'none' }}
                  >
                    {eventStatuses.map((eventStatus) => {
                      return (
                        <MenuItem
                          key={eventStatus.event_status_id + '_dialog'}
                          label={eventStatus.event_status_name}
                          value={eventStatus.event_status_id}
                          disabled={
                            eventStatus.disabled ||
                            isSubmitting ||
                            ['Complete', 'Archived'].includes(
                              orgEvent.data.event_status_name,
                            ) ||
                            (['Running', 'Judging'].includes(
                              orgEvent.data.event_status_name,
                            ) &&
                              eventStatus.restricted)
                          }
                        >
                          <ListItemText
                            primary={eventStatus.event_status_name}
                          />
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
              </Grid>
              <Field
                component={MUITextField}
                disabled={
                  isSubmitting ||
                  ['Judging', 'Complete', 'Archived'].includes(
                    orgEvent.data.event_status_name,
                  )
                }
                error={Boolean(touched.eventSummary && errors.eventSummary)}
                fullWidth
                helperText={touched.eventSummary && errors.eventSummary}
                inputProps={{ maxLength: 500 }}
                label='Event Summary'
                margin='normal'
                name='eventSummary'
                onBlur={handleBlur}
                onChange={(event) => {
                  handleChange(event);
                  handleFieldChange();
                }}
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
                <Typography sx={{ textAlign: 'center' }}>
                  Event Banner
                </Typography>
                <ImageUploader
                  assetType='banner_image'
                  assetUuid={orgEvent.data.banner_image_uuid}
                  entityUuid={orgEvent.data.event_uuid}
                  isSubmitting={
                    isSubmitting ||
                    ['Judging', 'Complete', 'Archived'].includes(
                      orgEvent.data.event_status_name,
                    )
                  }
                  setEntityAsset={setEntityAsset}
                  setSubmitting={setSubmitting}
                />
              </Box>
              <Box>
                <Editor
                  editorState={originalEventDescription}
                  onChange={handleEventDescriptionChange}
                  editable={
                    !isSubmitting &&
                    !['Judging', 'Complete', 'Archived'].includes(
                      orgEvent.data.event_status_name,
                    )
                  }
                  placeholderText='Event Description'
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
                          disabled={
                            isSubmitting ||
                            [
                              'Running',
                              'Judging',
                              'Complete',
                              'Archived',
                            ].includes(orgEvent.data.event_status_name)
                          }
                          loading={isLoading}
                          label='Event Start'
                          name='eventStartTs'
                          value={eventStartTs}
                          required
                          format='yyyy/MM/dd hh:mm a'
                          mask='____/__/__ __:__ _M'
                          maxDateTime={new Date(dayjs(eventEndTs))}
                          minDateTime={minDateTime}
                          minutesStep={15}
                          onAccept={handleFieldChange}
                          onChange={(val) => {
                            setEditing(true);
                            setEventStartTs(val);
                            if (eventEndTs < val)
                              setEventEndTs(
                                new Date(dayjs(val).add(1, 'week')),
                              );
                            if (
                              eventEndTs > new Date(dayjs(val).add(2, 'week'))
                            )
                              setEventEndTs(
                                new Date(dayjs(val).add(2, 'week')),
                              );
                          }}
                          onError={console.log}
                          sx={{
                            width: '245px',
                          }}
                        />
                      </Grid>
                      <Grid item>
                        <DateTimePicker
                          disabled={
                            isSubmitting ||
                            [
                              'Running',
                              'Judging',
                              'Complete',
                              'Archived',
                            ].includes(orgEvent.data.event_status_name)
                          }
                          loading={isLoading}
                          label='Event End'
                          name='eventEndTs'
                          value={eventEndTs}
                          required
                          format='yyyy/MM/dd hh:mm a'
                          mask='____/__/__ __:__ _M'
                          minDateTime={new Date(dayjs(eventStartTs))}
                          maxDateTime={
                            new Date(dayjs(eventStartTs).add(2, 'week'))
                          }
                          minutesStep={15}
                          onAccept={handleFieldChange}
                          onChange={(val) => {
                            setEditing(true);
                            setEventEndTs(val);
                          }}
                          onError={console.log}
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
                      disabled={
                        isSubmitting ||
                        ['Running', 'Judging', 'Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        )
                      }
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
                  {stackrefConfig.uiEnvironment !== 'beta' && (
                    <Grid item>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name='cloudAccountsEnabled'
                              checked={cloudAccountsEnabled}
                              disabled={
                                isSubmitting ||
                                ['Judging', 'Complete', 'Archived'].includes(
                                  orgEvent.data.event_status_name,
                                )
                              }
                              onChange={(event) => {
                                handleChange(event);
                                handleCloudAccountsEnabledChange(event);
                                handleFieldChange();
                              }}
                            />
                          }
                          label={
                            <Typography color='textPrimary'>
                              Cloud accounts enabled
                            </Typography>
                          }
                        />
                      </FormGroup>
                    </Grid>
                  )}
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
                      disabled={
                        isSubmitting ||
                        ['Running', 'Judging', 'Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        )
                      }
                      select
                      required
                      size='small'
                      id='event-type'
                      label='Event Type'
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
                            <ListItemText primary={eventType.event_type_name} />
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  <Grid item>
                    <TextField
                      disabled={
                        isSubmitting ||
                        ['Running', 'Judging', 'Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        )
                      }
                      select
                      required
                      size='small'
                      id='event-team-form-mode'
                      label='Team Formation Mode'
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
                            disabled={
                              isSubmitting ||
                              [
                                'Running',
                                'Judging',
                                'Complete',
                                'Archived',
                              ].includes(orgEvent.data.event_status_name)
                            }
                            key={
                              eventTeamFormMode.event_team_form_mode_id +
                              '_dialog'
                            }
                            label={eventTeamFormMode.event_team_form_mode_name}
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
                        disabled={
                          isSubmitting ||
                          [
                            'Running',
                            'Judging',
                            'Complete',
                            'Archived',
                          ].includes(orgEvent.data.event_status_name)
                        }
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
                        onChange={(event) => {
                          handleChange(event);
                          handleFieldChange();
                        }}
                        type='number'
                        value={values.eventMaxTeamSize}
                        variant='outlined'
                        sx={{
                          input: { color: 'text.primary' },
                          maxWidth: '150px',
                          width: '150px',
                        }}
                      />
                    )}
                  </Grid>
                </Grid>
                {isLoading ? (
                  <Skeleton height={60} width='50%' />
                ) : (
                  <Card
                    sx={{
                      m: 'auto',
                      mt: 2,
                      textAlign: 'center',
                      width: '50%',
                    }}
                    variant='outlined'
                  >
                    <CardHeader
                      title='Assigned StackCash'
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
                        <Slider
                          aria-labelledby='input-slider'
                          defaultValue={eventCoinBalance ? eventCoinBalance : 0}
                          disabled={
                            isSubmitting ||
                            ['Judging', 'Complete', 'Archived'].includes(
                              orgEvent.data.event_status_name,
                            )
                          }
                          value={typeof coinValue === 'number' ? coinValue : 0}
                          onChange={handleCoinSliderChange}
                          min={0}
                          max={orgCoinBalance + eventCoinBalance || 0}
                          marks={
                            eventCoinBalance !==
                            orgCoinBalance + eventCoinBalance
                              ? [
                                  {
                                    value: Number(eventCoinBalance),
                                    label: `Curr (${eventCoinBalance})`,
                                  },
                                  {
                                    value: Number(
                                      orgCoinBalance + eventCoinBalance,
                                    ),
                                    label: `Max (${
                                      orgCoinBalance + eventCoinBalance
                                    })`,
                                  },
                                ]
                              : [
                                  {
                                    value: Number(
                                      orgCoinBalance + eventCoinBalance,
                                    ),
                                    label: `Max (${
                                      orgCoinBalance + eventCoinBalance
                                    })`,
                                  },
                                ]
                          }
                          step={100}
                          sx={{
                            width: '80%',
                          }}
                        />
                        <Field
                          component={TextField}
                          disabled={
                            isSubmitting ||
                            ['Judging', 'Complete', 'Archived'].includes(
                              orgEvent.data.event_status_name,
                            )
                          }
                          type='number'
                          value={typeof coinValue === 'number' ? coinValue : 0}
                          size='small'
                          onChange={handleCoinInputChange}
                          onBlur={handleCoinSliderBlur}
                          sx={{
                            ml: 2,
                            mt: 0.2,
                            width: 120,
                          }}
                          inputProps={{
                            step: 1,
                            min: 0,
                            max:
                              Number(
                                organization?.bank_balance + eventCoinBalance,
                              ) || 0,
                            type: 'number',
                            'aria-labelledby': 'input-slider',
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
              {['Complete', 'Archived'].includes(
                orgEvent.data.event_status_name,
              ) ? null : (
                <>
                  <Box sx={{ display: 'flex', mt: 2 }}>
                    <LoadingButton
                      color='primary'
                      disabled={
                        isSubmitting ||
                        !isEditing ||
                        ['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        )
                      }
                      loading={isSubmitting}
                      size='large'
                      sx={{
                        mx: 'auto',
                      }}
                      type='button'
                      variant='contained'
                      onClick={async () => {
                        if (eventStatus === 4) {
                          // Marked 'Complete'
                          confirm({
                            title: 'Set event to complete?',
                            content:
                              'Are you sure you want to mark this event Complete? Further editing or Judging will become unavailable.',
                            confirmationText: 'OK',
                            dialogProps: {
                              PaperProps: {
                                sx: {
                                  bgcolor: theme.palette.background.default,
                                },
                              },
                            },
                            titleProps: {
                              sx: {
                                color: theme.palette.text.primary,
                                fontFamily: theme.typography.fontFamily,
                              },
                            },
                            contentProps: {
                              sx: {
                                color: theme.palette.text.primary,
                                fontFamily: theme.typography.fontFamily,
                              },
                            },
                            confirmationButtonProps: {
                              autoFocus: true,
                              variant: 'contained',
                            },
                            cancellationButtonProps: {
                              variant: 'outlined',
                            },
                          })
                            .then(() => handleSubmit())
                            .catch((error) => console.error(error));
                        } else handleSubmit();
                      }}
                    >
                      Save Changes
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
                </>
              )}
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default EventEditForm;
