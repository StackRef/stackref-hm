import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import useAuth from 'src/hooks/useAuth';
import TeamCreate from './TeamCreate';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '@mui/material/styles';
import useIsMountedRef from 'use-is-mounted-ref';

const NewTeamDialog = (props) => {
  const { orgEvent, teamFormMode, newTeamOpen, handleNewTeamClose, ...other } =
    props;

  const { user } = useAuth();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();

  return (
    <Dialog open={newTeamOpen} fullWidth onClose={handleNewTeamClose}>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          px: 2,
          py: 1,
        }}
      >
        New Team
      </DialogTitle>
      <Formik
        initialValues={{
          teamName: '',
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          teamName: Yup.string()
            .max(100)
            .required('A valid Team name is required')
            .typeError('You must specify a valid team name'),
        })}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            const payload = {};
            if (isMountedRef.current) {
              payload['user'] = user;
              payload['action'] = 'create';
              payload['event_uuid'] = orgEvent.event_uuid;
              payload['team_name'] = values.teamName;
              payload['team_form_mode'] = teamFormMode;

              await TeamCreate(payload, (response) => {
                if (!response || response.status_code !== 200)
                  throw new Error('Team create failed');
              })
                .then(() => {
                  handleNewTeamClose();
                  setStatus({ success: true });
                  setSubmitting(false);
                  toast.success('Team created', { containerId: 'results' });
                })
                .catch((err) => {
                  setStatus({ success: false });
                  setErrors({ submit: err.message });
                  setSubmitting(false);
                });
            }
          } catch (err) {
            console.error(`>> Create Team: ${err}`);
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
          <form noValidate onSubmit={handleSubmit} {...other}>
            <DialogContent>
              <DialogContentText color='text.primary'>
                Enter the new team's name
              </DialogContentText>
              <TextField
                autoFocus
                error={Boolean(touched.teamName && errors.teamName)}
                fullWidth
                helperText={touched.teamName && errors.teamName}
                inputProps={{ maxLength: 100 }}
                label='Team Name'
                margin='normal'
                name='teamName'
                onBlur={handleBlur}
                onChange={handleChange}
                variant='outlined'
                sx={{
                  input: { color: 'text.primary' },
                }}
              />
              {errors.submit && (
                <Box sx={{ mt: 3 }}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <LoadingButton
                color='primary'
                disabled={isSubmitting}
                loading={isSubmitting}
                type='submit'
                variant='contained'
              >
                Create Team
              </LoadingButton>
              <Button
                disabled={isSubmitting}
                onClick={handleNewTeamClose}
                variant='outlined'
              >
                Cancel
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
};

export default NewTeamDialog;
