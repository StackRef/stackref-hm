import { useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Field, Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormHelperText,
  Grid,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
//import TeamEdit from './TeamEdit';
import TeamEdit from 'src/components/dashboard/admin/TeamEdit';
import AssetCreate from 'src/components/dashboard/admin/AssetCreate';
import GetEvents from 'src/components/stackref/GetEvents';
import GetTeams from 'src/components/stackref/GetTeams';
import CoinBankTransaction from 'src/components/dashboard/admin/CoinBankTransaction';
import CloudAccountUpdate from 'src/components/dashboard/resource/CloudAccountUpdate';
import { useTheme } from '@mui/material/styles';
import ImageUploader from 'src/components/ImageUploader';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';

const TeamEditForm = (props) => {
  const { team, setTeam, ...other } = props;
  const [orgEvent, setOrgEvent] = useState();
  const [teamCoinBalance, setTeamCoinBalance] = useState(0);
  const [eventCoinBalance, setEventCoinBalance] = useState(0);
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [coinValue, setCoinValue] = useState(team?.bank_balance || 0);
  const [isLoading, setLoading] = useState(true);
  const [isEditing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(team?.team_details?.team_name || '');
  const [bannerImage, setBannerImage] = useState();
  const [avatarImage, setAvatarImage] = useState();
  const [isGeneratingBannerImage, setGeneratingBannerImage] = useState(false);
  const [isGeneratingAvatarImage, setGeneratingAvatarImage] = useState(false);
  const [isSubmittingCloudAccount, setSubmittingCloudAccount] = useState(false);
  const theme = useTheme();

  const handleFieldChange = () => {
    setEditing(true);
  };

  useEffect(() => {
    setBannerImage(team.banner_image_uuid);
    setAvatarImage(team.avatar_image_uuid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateImage = async (asset_type) => {
    try {
      if (isMountedRef.current) {
        if (asset_type == 'banner_image') {
          setGeneratingBannerImage(true);
        }
        if (asset_type == 'avatar_image') {
          setGeneratingAvatarImage(true);
        }

        const payload = {
          user: user,
          action: 'generate_image',
          asset_type: asset_type,
          asset_entity_uuid: team.team_uuid,
          entity_name: teamName,
        };

        await AssetCreate(payload, (response) => {
          if (!response || response.status_code !== 200) {
            throw new Error(
              `${response?.error ? response.error : 'Image generation failed'}`,
            );
          }
          if (response?.asset_uuid) {
            if (asset_type == 'banner_image') {
              setBannerImage(response.asset_uuid);
              setGeneratingBannerImage(false);
            }
            if (asset_type == 'avatar_image') {
              setAvatarImage(response.asset_uuid);
              setGeneratingAvatarImage(false);
            }
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
        if (asset_type == 'banner_image') {
          setGeneratingBannerImage(false);
        }
        if (asset_type == 'avatar_image') {
          setGeneratingAvatarImage(false);
        }
        toast.error(err.message, { containerId: 'results' });
      }
    }
  };

  const getOrgEvent = useCallback(
    async (eventUuid) => {
      console.log(':: getOrgEvent');
      try {
        await GetEvents(user, eventUuid)
          .then((data) => {
            try {
              if (data?.length > 0) {
                setOrgEvent(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
              } else setOrgEvent(null);
            } catch (err) {
              throw err;
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        setOrgEvent(null);
        console.error(`>> getOrgEvent: ${err}`);
      }
    },
    [user],
  );

  const getTeamCoinBalance = useCallback(async () => {
    console.log(':: getTeamCoinBalance');
    try {
      if (team.bank_balance) {
        setTeamCoinBalance(team.bank_balance);
      } else {
        setTeamCoinBalance(0);
      }
    } catch (err) {
      console.error(`>> getTeamCoinBalance: ${err}`);
    }
  }, [team]);

  useEffect(() => {
    getOrgEvent(team.event_uuid);
  }, [getOrgEvent, team]);

  useEffect(() => {
    async function initialize() {
      await getTeamCoinBalance(team.team_uuid);
      setLoading(false);
    }
    initialize();
  }, [getTeamCoinBalance, team]);

  useEffect(() => {
    setEventCoinBalance(orgEvent?.bank_balance || 0);
  }, [orgEvent]);

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
    } else if (coinValue > eventCoinBalance + teamCoinBalance) {
      setCoinValue(eventCoinBalance + teamCoinBalance);
    }
  };

  const handleCloudAccountClick = async (action) => {
    try {
      setSubmittingCloudAccount(true);

      const payload = {};
      payload['user'] = user;
      payload['action'] = action;
      payload['entity_uuid'] = team?.team_uuid;

      await CloudAccountUpdate(payload, (response) => {
        //if (!response || response.status_code !== 200)
        if (!response) throw new Error(`Cloud account ${action}ment failed`);
      })
        .then(() => {
          setSubmittingCloudAccount(false);
          toast.success(`Cloud account ${action}ed`, {
            containerId: 'results',
          });
          getTeam(team.event_uuid, team.team_uuid);
        })
        .catch((err) => {
          setSubmittingCloudAccount(false);
          toast.error(err.message, { containerId: 'results' });
        });
    } catch (err) {
      console.error(`>> CloudAccountUpdate: ${err}`);
      setSubmitting(false);
    }
  };

  const getTeam = async (eventUuid, teamUuid) => {
    console.log(':: getTeam');
    try {
      await GetTeams(user, eventUuid, teamUuid)
        .then((data) => {
          try {
            setTeam(data[0]); // TODO: API always returns an array even when single. Return object instead and not use [0]
          } catch (error) {
            throw new Error(error);
          }
        })
        .catch((error) => {
          console.error('>> GetTeams: ', error);
          setTeam(null);
          throw error;
        });
    } catch (error) {
      console.log(`>> getTeam: ${error}`);
    }
  };

  const UpdateTeamCoinBalance = async () => {
    console.log(':: UpdateTeamCoinBalance');
    try {
      if (isMountedRef.current) {
        const payload = {};
        payload['user'] = user;
        payload['action'] = 'transaction';

        // If we are dropping the value, take from Event and give to Org
        // If we are increasing the value, take from org and give to Event
        if (coinValue > teamCoinBalance) {
          payload['sending_entity_uuid'] = team.event_uuid;
          payload['receiving_entity_uuid'] = team.team_uuid;
          payload['transaction_value'] = Number(coinValue - teamCoinBalance);
        } else {
          payload['sending_entity_uuid'] = team.team_uuid;
          payload['receiving_entity_uuid'] = team.event_uuid;
          payload['transaction_value'] = Number(teamCoinBalance - coinValue);
        }

        await CoinBankTransaction(payload, (response) => {
          if (!response || response.status_code !== 200)
            throw new Error(
              `Coin transaction failed: Response ${response?.status_code}`,
            );
          if (coinValue > teamCoinBalance) {
            setTeamCoinBalance(response.bank_balances?.receiver_coin_balance);
            setCoinValue(response.bank_balances?.receiver_coin_balance);
            setEventCoinBalance(response.bank_balances?.sender_coin_balance);
          } else {
            setTeamCoinBalance(response.bank_balances?.sender_coin_balance);
            setCoinValue(response.bank_balances?.sender_coin_balance);
            setEventCoinBalance(response.bank_balances?.receiver_coin_balance);
          }
        }).catch((error) => {
          throw error;
        });
      }
    } catch (error) {
      console.error(`>> UpdateTeamCoinBalance: ${error}`);
      setEditing(false);
      toast.error(error.message, { containerId: 'results' });
    }
  };

  return (
    <Card
      sx={{
        m: 'auto',
        width: '80%',
      }}
    >
      <CardHeader
        title='Edit Team'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <Formik
          initialValues={{
            teamUuid: team.team_uuid,
            teamMission: team.team_details.team_mission || '',
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            /*
            teamName: Yup.string()
              .max(50)
              .required('Team name is required')
              .typeError('You must specify a valid team name'),
            */
            teamMission: Yup.string().max(1500),
          })}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
            try {
              if (isMountedRef.current) {
                setSubmitting(true);

                const payload = {};
                payload['user'] = user;
                payload['action'] = 'update';
                payload['team_uuid'] = values.teamUuid;
                payload['team_name'] = teamName;
                payload['team_mission'] = values.teamMission;

                await TeamEdit(payload, (response) => {
                  if (!response || response.status_code !== 200)
                    throw new Error('Team update failed');
                })
                  .then(() => {
                    setStatus({ success: true });
                  })
                  .catch((error) => {
                    console.log(`>> ${error}`);
                    throw new Error('Team update failed');
                  });
                await getTeam(team.event_uuid, values.teamUuid);
                if (
                  typeof coinValue !== 'undefined' &&
                  coinValue !== teamCoinBalance
                ) {
                  await UpdateTeamCoinBalance();
                }
                setStatus({ success: true });
                setSubmitting(false);
                setEditing(false);
                toast.success('Team updated', { containerId: 'results' });
              }
            } catch (error) {
              console.error(`>> TeamEditForm: ${error}`);
              if (isMountedRef.current) {
                toast.error(error.message, { containerId: 'results' });
                setStatus({ success: false });
                setErrors({ submit: error.message });
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
              <TextField
                autoFocus
                disabled={
                  isSubmitting ||
                  ['Judging', 'Complete', 'Archived'].includes(
                    orgEvent?.event_status_name,
                  )
                }
                error={Boolean(touched.teamName && errors.teamName)}
                fullWidth
                helperText={touched.teamName && errors.teamName}
                inputProps={{ maxLength: 50 }}
                label='Team Name'
                margin='normal'
                name='teamName'
                onBlur={handleBlur}
                onChange={(event) => {
                  handleChange(event);
                  handleFieldChange();
                }}
                value={teamName}
                variant='outlined'
                sx={{
                  input: { color: 'text.primary' },
                  mb: 2,
                }}
              />
              <TextField
                autoFocus
                disabled={
                  isSubmitting ||
                  ['Judging', 'Complete', 'Archived'].includes(
                    orgEvent?.event_status_name,
                  )
                }
                error={Boolean(touched.teamMission && errors.teamMission)}
                fullWidth
                helperText={touched.teamMission && errors.teamMission}
                inputProps={{ maxLength: 1500 }}
                label='Mission Statement'
                margin='normal'
                name='teamMission'
                onBlur={handleBlur}
                onChange={(event) => {
                  handleChange(event);
                  handleFieldChange();
                }}
                value={values.teamMission}
                variant='outlined'
                sx={{
                  input: { color: 'text.primary' },
                  mb: 2,
                }}
              />
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <Typography sx={{ textAlign: 'center' }}>
                    Team Banner
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
                        isSubmitting ||
                        isGeneratingBannerImage ||
                        teamName == ''
                      }
                      loadingPosition='start'
                      startIcon={<AddPhotoAlternateRoundedIcon />}
                      loading={isGeneratingBannerImage}
                      onClick={(event) => {
                        handleGenerateImage('banner_image');
                      }}
                      variant='contained'
                      sx={{ mx: 3 }}
                    >
                      <Box>
                        {isGeneratingBannerImage
                          ? 'Generating Image…'
                          : 'Generate One For Me'}
                      </Box>
                    </LoadingButton>
                    <Typography>... or upload one below</Typography>
                  </Box>
                  <ImageUploader
                    assetType='banner_image'
                    assetUuid={bannerImage}
                    entityUuid={team.team_uuid}
                    isSubmitting={isSubmitting || isGeneratingBannerImage}
                    setEntityAsset={setBannerImage}
                    setSubmitting={setSubmitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography sx={{ textAlign: 'center' }}>
                    Team Avatar
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
                        isSubmitting ||
                        isGeneratingAvatarImage ||
                        teamName == ''
                      }
                      loadingPosition='start'
                      startIcon={<AddPhotoAlternateRoundedIcon />}
                      loading={isGeneratingAvatarImage}
                      onClick={(event) => {
                        handleGenerateImage('avatar_image');
                      }}
                      variant='contained'
                      sx={{ mx: 3 }}
                    >
                      <Box>
                        {isGeneratingAvatarImage
                          ? 'Generating Image…'
                          : 'Generate One For Me'}
                      </Box>
                    </LoadingButton>
                    <Typography>... or upload one below</Typography>
                  </Box>
                  <ImageUploader
                    assetType='avatar_image'
                    assetUuid={avatarImage}
                    entityUuid={team.team_uuid}
                    isSubmitting={isSubmitting || isGeneratingAvatarImage}
                    setEntityAsset={setAvatarImage}
                    setSubmitting={setSubmitting}
                  />
                </Grid>
              </Grid>
              {!isLoading && (
                <Grid
                  container
                  align='center'
                  alignItems='center'
                  justify='center'
                  spacing={2}
                >
                  <Grid item align='center' xs={true}>
                    <Card display='flex'>
                      <CardHeader
                        title='Assigned StackCash'
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.background.paper,
                          py: 1,
                        }}
                      />
                      <CardContent
                        sx={{
                          backgroundColor: theme.palette.background.default,
                        }}
                      >
                        <Box sx={{ p: 2 }}>
                          {(orgEvent?.bank_balance === 0 &&
                            teamCoinBalance > 0) ||
                          orgEvent?.bank_balance > 0 ? (
                            <>
                              <Slider
                                aria-labelledby='input-slider'
                                defaultValue={
                                  teamCoinBalance ? teamCoinBalance : 0
                                }
                                disabled={
                                  isSubmitting ||
                                  ['Judging', 'Complete', 'Archived'].includes(
                                    orgEvent?.event_status_name,
                                  )
                                }
                                value={
                                  typeof coinValue === 'number' ? coinValue : 0
                                }
                                onChange={handleCoinSliderChange}
                                min={0}
                                max={eventCoinBalance + teamCoinBalance || 0}
                                marks={
                                  teamCoinBalance !==
                                  eventCoinBalance + teamCoinBalance
                                    ? [
                                        {
                                          value: Number(teamCoinBalance),
                                          label: `Curr (${teamCoinBalance})`,
                                        },
                                        {
                                          value: Number(
                                            eventCoinBalance + teamCoinBalance,
                                          ),
                                          label: `Max (${
                                            eventCoinBalance + teamCoinBalance
                                          })`,
                                        },
                                      ]
                                    : [
                                        {
                                          value: Number(
                                            eventCoinBalance + teamCoinBalance,
                                          ),
                                          label: `Max (${
                                            eventCoinBalance + teamCoinBalance
                                          })`,
                                        },
                                      ]
                                }
                                step={10}
                                sx={{
                                  width: '80%',
                                }}
                              />
                              <Field
                                component={TextField}
                                disabled={
                                  isSubmitting ||
                                  ['Judging', 'Complete', 'Archived'].includes(
                                    orgEvent?.event_status_name,
                                  )
                                }
                                type='number'
                                value={coinValue}
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
                                      eventCoinBalance + teamCoinBalance,
                                    ) || 0,
                                  type: 'number',
                                  'aria-labelledby': 'input-slider',
                                }}
                              />
                            </>
                          ) : (
                            <Typography color='text.secondary'>
                              No StackCash available to distribute
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item align='center' xs={true}>
                    <Card
                      sx={{
                        m: 'auto',
                      }}
                    >
                      <CardContent
                        sx={{
                          backgroundColor: theme.palette.background.default,
                        }}
                      >
                        {team.cloud_account?.cloud_account_name ? (
                          <>
                            <Typography color='text.primary' variant='h6'>
                              Cloud Account
                            </Typography>
                            <Typography
                              color='text.secondary'
                              sx={{
                                mb: 2,
                              }}
                            >
                              {team.cloud_account.cloud_account_name}
                            </Typography>
                            <LoadingButton
                              disabled={isSubmittingCloudAccount}
                              loading={isSubmittingCloudAccount}
                              onClick={() =>
                                handleCloudAccountClick('unassign')
                              }
                              variant='contained'
                            >
                              Unassign Cloud Account
                            </LoadingButton>
                          </>
                        ) : (
                          <>
                            <Typography
                              color='text.secondary'
                              sx={{
                                mb: 2,
                              }}
                            >
                              No Cloud Account Assigned
                            </Typography>
                            {orgEvent?.cloud_accounts_enabled ? (
                              <LoadingButton
                                disabled={
                                  isSubmittingCloudAccount ||
                                  ['Judging', 'Complete', 'Archived'].includes(
                                    orgEvent?.event_status_name,
                                  )
                                }
                                loading={isSubmittingCloudAccount}
                                onClick={() =>
                                  handleCloudAccountClick('assign')
                                }
                                variant='contained'
                              >
                                Assign Cloud Account
                              </LoadingButton>
                            ) : null}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              <Box
                sx={{
                  mx: 20,
                  mt: 2,
                }}
              >
                <LoadingButton
                  color='primary'
                  disabled={
                    isSubmitting ||
                    !isEditing ||
                    ['Complete', 'Archived'].includes(
                      orgEvent?.event_status_name,
                    )
                  }
                  fullWidth
                  loading={isSubmitting}
                  size='large'
                  type='submit'
                  variant='contained'
                >
                  Edit Team
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

export default TeamEditForm;
