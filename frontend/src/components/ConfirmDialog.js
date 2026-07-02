import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

const ConfirmDialog = (props) => {
  const { title, children, open, setOpen, onConfirm } = props;
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby='confirm-dialog'
    >
      <DialogTitle id='confirm-dialog'>{title}</DialogTitle>
      <DialogContent>
        <Typography color='textPrimary' sx={{ mt: 1 }} variant='subtitle2'>
          {children}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          onClick={() => setOpen(false)}
          color='secondary'
        >
          No
        </Button>
        <Button
          variant='contained'
          onClick={() => {
            setOpen(false);
            onConfirm();
          }}
          color='primary'
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ConfirmDialog;
