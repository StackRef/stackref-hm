import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Box,
  FormHelperText,
  LinearProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import TeamEventFeedbackEdit from './TeamEventFeedbackEdit';
import useStackRef from 'src/hooks/useStackRef';
import GetTeamEventFeedback from 'src/components/stackref/GetTeamEventFeedback';
import Editor from 'src/components/dashboard/Editor';

const TeamFeedback = (props) => {
  const { team, ...other } = props;
  const { activeOrgEvent, participant } = useStackRef();
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [isEditingFeedback, setEditingFeedback] = useState(false);
  const [teamFeedback, setTeamFeedback] = useState();
  const [newTeamFeedback, setNewTeamFeedback] = useState();
  const theme = useTheme();
  const feedbackRef = useRef(null);

  const originalTeamFeedback = useMemo(() => {
    let content =
      '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';
    if (teamFeedback?.includes('root')) {
      content = teamFeedback;
    }
    return content;
  }, [teamFeedback]);

  const getTeamFeedback = useCallback(
    async (teamUuid) => {
      console.log(':: getTeamFeedback');
      try {
        await GetTeamEventFeedback(user, {
          participantUuid: participant?.participant_uuid,
          teamUuid: teamUuid,
        })
          .then((data) => {
            try {
              if (
                data?.length > 0 &&
                data?.[0].feedback_text?.includes('root')
              ) {
                setTeamFeedback(data[0].feedback_text);
              }
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> getTeamFeedback: ${err}`);
      }
    },
    [participant, user],
  );

  useEffect(() => {
    async function initialize() {
      await getTeamFeedback(team?.team_uuid);
      setLoading(false);
    }
    initialize();
  }, [getTeamFeedback, team]);

  const handleTeamFeedbackChange = (event) => {
    const rteContent = JSON.stringify(event);
    newTeamFeedback && setEditingFeedback(true);
    rteContent && setNewTeamFeedback(rteContent);
  };

  return (
    <Box sx={{ width: '80%' }}>
      <Formik
        initialValues={{
          submit: null,
        }}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            if (isMountedRef.current) {
              const payload = {};
              payload['user'] = user;
              payload['action'] = newTeamFeedback ? 'update' : 'create';
              payload['participant_uuid'] = participant?.participant_uuid;
              payload['team_uuid'] = team.team_uuid;
              payload['feedback_text'] = newTeamFeedback;

              await TeamEventFeedbackEdit(payload, (response) => {
                if (!response || response.status_code !== 200)
                  throw new Error('Feedback update failed');
              })
                .then(async () => {
                  setStatus({ success: true });
                  setEditingFeedback(false);
                  setSubmitting(false);
                  toast.success('Feedback updated', { containerId: 'results' });
                })
                .catch((error) => {
                  setStatus({ success: false });
                  setErrors({ submit: error.message });
                  setEditingFeedback(false);
                  setSubmitting(false);
                  toast.error(error.message, { containerId: 'results' });
                });
              await getTeamFeedback(team.team_uuid);
            }
          } catch (error) {
            console.error(`>> TeamFeedback: ${error}`);
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
            <Card
              sx={{
                minWidth: '100%',
                width: '100%',
              }}
            >
              <CardHeader
                title='Your Feedback'
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.background.paper,
                  py: 1,
                }}
              />
              <CardContent>
                {isLoading ? (
                  <Box
                    sx={{
                      m: 2,
                    }}
                  >
                    <LinearProgress />
                  </Box>
                ) : (
                  <Editor
                    editorState={originalTeamFeedback}
                    onChange={handleTeamFeedbackChange}
                    editable={
                      activeOrgEvent?.event_status_name === 'Judging' &&
                      !isSubmitting
                    }
                    placeholderText={
                      activeOrgEvent?.event_status_name === 'Judging'
                        ? 'Provide Team Feedback'
                        : 'Feedback can only be submitted when the event is in its judging phase.'
                    }
                    sx={{ width: '100%' }}
                  />
                )}
              </CardContent>
            </Card>
            {activeOrgEvent?.event_status_name === 'Judging' && (
              <>
                <Box
                  sx={{
                    justifyContent: 'center',
                    display: 'flex',
                    mx: 5,
                    my: 2,
                  }}
                >
                  <LoadingButton
                    color='primary'
                    disabled={isSubmitting || !isEditingFeedback}
                    loading={isSubmitting}
                    size='large'
                    type='submit'
                    variant='contained'
                  >
                    Submit Feedback
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
              </>
            )}
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default TeamFeedback;
