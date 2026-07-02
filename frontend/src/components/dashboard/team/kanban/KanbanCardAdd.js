import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Box, Button, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  addToKanbanItems,
  getKanbanItems,
  postKanbanItems,
} from 'src/slices/kanban';
import { useDispatch } from 'src/store';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';

const KanbanCardAdd = (props) => {
  const { statusId, isSubmitting, setSubmitting, ...other } = props;

  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const { user } = useAuth();
  const { activeTeam, activeTeamMember } = useStackRef();

  const handleChange = (event) => {
    setItemTitle(event.target.value);
  };

  const handleAddInit = () => {
    setIsExpanded(true);
  };

  const handleAddCancel = () => {
    setIsExpanded(false);
    setItemTitle('');
  };

  const handleAddConfirm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        user: user,
        action: 'add',
        team_uuid: activeTeam?.team_uuid,
        kanban_item_status_id: statusId,
        kanban_item_issuer_uuid: activeTeamMember?.team_member_uuid,
        kanban_item_details: {
          item_title: itemTitle,
        },
      };
      await dispatch(postKanbanItems(payload))
        .then((data) => {
          dispatch(
            getKanbanItems({ user: user, teamUuid: activeTeam?.team_uuid }),
          );
        })
        .catch((error) => {
          setSubmitting(false);
          throw new Error(error);
        });
      //dispatch(addToKanbanItems({issuerUuid: activeTeamMember?.team_member_uuid, statusId: statusId, itemTitle: itemTitle || 'Untitled Card'}));
      setIsExpanded(false);
      setSubmitting(false);
      setItemTitle('');
      toast.success('Card created', { containerId: 'results' });
    } catch (err) {
      console.error(err);
      toast.error(err.message, { containerId: 'results' });
    }
  };

  return (
    <div {...other}>
      {isExpanded ? (
        <>
          <TextField
            fullWidth
            label='Title'
            name='itemTitle'
            onChange={handleChange}
            value={itemTitle}
            variant='outlined'
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
            }}
          >
            <Button
              disabled={isSubmitting}
              color='primary'
              onClick={handleAddCancel}
              variant='text'
            >
              Cancel
            </Button>
            <LoadingButton
              disabled={isSubmitting}
              color='primary'
              loading={isSubmitting}
              onClick={handleAddConfirm}
              variant='contained'
            >
              Add
            </LoadingButton>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button color='primary' onClick={handleAddInit} variant='text'>
            Add Item
          </Button>
        </Box>
      )}
    </div>
  );
};

KanbanCardAdd.propTypes = {
  statusId: PropTypes.number.isRequired,
};

export default KanbanCardAdd;
