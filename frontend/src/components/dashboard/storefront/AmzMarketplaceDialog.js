import { Field, Formik } from 'formik';
import * as Yup from 'yup';
import { TextField as MUITextField } from 'formik-mui';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import { toast } from 'react-toastify';
import StackCashPurchase from 'src/components/stackref/StackCashPurchase';
//import StackCashRounded from 'src/icons/StackCashRounded';

import { useTheme } from '@mui/material/styles';

const AmzMarketplaceDialog = (props) => {
  const { open, onClose } = props;

  const theme = useTheme();
  const { user } = useAuth();

  return (
    <Dialog open={open} fullWidth onClose={onClose}>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          px: 2,
          py: 1,
        }}
      >
        Purchase StackCash via Amazon Marketplace
      </DialogTitle>
      <Formik
        initialValues={{
          stackCashQty: 100,
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          stackCashQty: Yup.number()
            .positive()
            .integer()
            .min(100, 'Value must be > 100')
            .max(1000, 'Value must be < 1000')
            .required('A valid StackCash quantity is required')
            .typeError('Value must be a number between 100 and 1000')
            .test(
              'is-multiple-of-100',
              'Value must be a multiple of 100',
              (value) => Number.isInteger(value) && value % 100 === 0,
            ),
        })}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            const payload = {};
            if (isMountedRef.current) {
              payload['user'] = user;
              payload['action'] = 'purchase';
              payload['method'] = 'amz_mkt_metering';
              payload['quantity'] = values.stackCashQty;

              await StackCashPurchase(payload, (response) => {
                if (!response || response.status_code !== 200)
                  if (response.error) throw new Error(response.error);
                  else throw new Error('StackCash purchase failed');
              })
                .then(() => {
                  onClose();
                  setStatus({ success: true });
                  setSubmitting(false);
                  getOrgDetails();
                  toast.success(`${values.stackCashQty} StackCash purchased`, {
                    containerId: 'results',
                  });
                })
                .catch((err) => {
                  throw err;
                });
            }
          } catch (err) {
            console.error(`>> Purchase StackCash: ${err}`);
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
          <form noValidate onSubmit={handleSubmit}>
            <DialogContent>
              <Box
                color='text.primary'
                sx={{
                  textAlign: 'center',
                }}
              >
                <Typography>
                  How much StackCash would you like to purchase?
                </Typography>
                <Typography variant='caption'>
                  (StackCash must be purchased in multiples of 100; 1000 maximum
                  per transaction.)
                </Typography>
                <Field
                  component={MUITextField}
                  autoFocus
                  InputProps={{
                    inputProps: {
                      min: '100',
                      max: '1000',
                      step: '100',
                    },
                  }}
                  label='StackCash'
                  margin='normal'
                  name='stackCashQty'
                  onBlur={handleBlur}
                  //onChange={(event) => {handleChange(event); handleFieldChange();}}
                  type='number'
                  value={values.stackCashQty}
                  variant='outlined'
                  sx={{
                    input: { color: 'text.primary' },
                    maxWidth: '150px',
                    width: '150px',
                  }}
                />
                {errors.submit && (
                  <Box sx={{ mt: 2 }}>
                    <FormHelperText error>{errors.submit}</FormHelperText>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: 'center',
              }}
            >
              <LoadingButton
                color='primary'
                disabled={isSubmitting}
                loading={isSubmitting}
                type='submit'
                variant='contained'
              >
                Purchase StackCash
              </LoadingButton>
              <Button onClick={onClose} variant='outlined'>
                Cancel
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AmzMarketplaceDialog;
