import { useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormHelperText,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import TeamEdit from 'src/components/dashboard/admin/TeamEdit';
import { useTheme } from '@mui/material/styles';
import ImageUploader from 'src/components/ImageUploader';
import AssetCreate from 'src/components/dashboard/admin/AssetCreate';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';

const TeamEditForm = (props) => {
  const { ...other } = props;

  const { activeOrgEvent, activeTeam, initializeTeams } = useStackRef();
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [isEditing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(activeTeam?.team_details.team_name);
  const [bannerImage, setBannerImage] = useState();
  const [avatarImage, setAvatarImage] = useState();
  const [isGeneratingBannerImage, setGeneratingBannerImage] = useState(false);
  const [isGeneratingAvatarImage, setGeneratingAvatarImage] = useState(false);
  const [teamCoinBalance, setTeamCoinBalance] = useState(0);
  const [entityAsset, setEntityAsset] = useState();
  const theme = useTheme();

  const handleFieldChange = () => {
    setEditing(true);
  };

  useEffect(() => {
    setBannerImage(activeTeam.banner_image_uuid);
    setAvatarImage(activeTeam.avatar_image_uuid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeamNameChange = (event) => {
    console.log(event);
    setTeamName(event.target.value);
  };

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
          asset_entity_uuid: activeTeam.team_uuid,
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
      console.error(`>> TeamEditForm: ${err}`);
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

  const getTeamCoinBalance = useCallback(async () => {
    console.log(':: getTeamCoinBalance');
    try {
      if (activeTeam.bank_balance) {
        setTeamCoinBalance(activeTeam.bank_balance);
      } else {
        setTeamCoinBalance(0);
      }
    } catch (err) {
      console.error(`>> getTeamCoinBalance: ${err}`);
    }
  }, [activeTeam]);

  useEffect(() => {
    async function initialize() {
      await getTeamCoinBalance(activeTeam.team_uuid);
      setLoading(false);
    }
    if (activeTeam) {
      initialize();
    }
  }, [getTeamCoinBalance, activeTeam]);

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
            teamUuid: activeTeam?.team_uuid,
            teamName: activeTeam?.team_details.team_name || '',
            teamMission: activeTeam?.team_details.team_mission || '',
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            teamName: Yup.string()
              .max(50)
              .required('Team name is required')
              .typeError('You must specify a valid Team name'),
            teamMission: Yup.string()
              .max(1500)
              .typeError('You must specify a valid Team mission statement'),
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
                payload['team_name'] = values.teamName;
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
                await initializeTeams();
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
                    activeOrgEvent?.event_status_name,
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
                  handleTeamNameChange(event);
                }}
                value={values.teamName}
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
                    activeOrgEvent?.event_status_name,
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
                        values.teamName == ''
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
                    entityUuid={activeTeam.team_uuid}
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
                    entityUuid={activeTeam.team_uuid}
                    isSubmitting={isSubmitting || isGeneratingAvatarImage}
                    setEntityAsset={setAvatarImage}
                    setSubmitting={setSubmitting}
                  />
                </Grid>
              </Grid>
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
                      activeOrgEvent?.event_status_name,
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
