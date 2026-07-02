import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';

import InvitationsUploader from 'src/components/InvitationsUploader';

const OrgInvitationsUploadDialog = (props) => {
  const { title, open, onClose, children, ...other } = props;

  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [entityAsset, setEntityAsset] = useState();

  const handleNewInviteUploadClose = () => {
    onClose();
    setEntityAsset(null);
  };

  return (
    <Dialog open={open} onClose={onClose} {...other}>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          px: 2,
          py: 1,
        }}
      >
        Upload an Invitation List
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <InvitationsUploader
          assetType='invitation_list'
          entityUuid={user.organization_uuid}
          isSubmitting={isSubmitting}
          setEntityAsset={setEntityAsset}
          setSubmitting={setSubmitting}
        />
        {entityAsset ? (
          <Typography color='text.secondary' variant='subtitle2'>
            You will receive a notification once the list has been processed
          </Typography>
        ) : (
          <Box width='100%' justifyContent='center' textAlign='center'>
            <Typography color='text.secondary' variant='subtitle2'>
              Max 100 emails per file
            </Typography>
            <Typography color='text.secondary' variant='subtitle2'>
              Files must be CSV, TSV, or Microsoft Excel documents
            </Typography>
          </Box>
        )}
        <DialogActions
          sx={{
            justifyContent: 'center',
            mt: 2,
          }}
        >
          <LoadingButton
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleNewInviteUploadClose}
            size='small'
            type='button'
            variant='outlined'
          >
            {entityAsset ? 'Close' : 'Cancel'}
          </LoadingButton>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default OrgInvitationsUploadDialog;
