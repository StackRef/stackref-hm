import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  OutlinedInput,
  Tooltip,
  Typography,
} from '@mui/material';
import Gravatar from 'src/icons/Gravatar';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { darken, useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import {
  getKanbanItems,
  postKanbanItems,
  reassignKanbanItem,
  renameKanbanItem,
} from 'src/slices/kanban';
import { useDispatch } from 'src/store';
import { toast } from 'react-toastify';

const Item = (props) => {
  const {
    activeCard,
    isDragging,
    isSubmitting,
    setSubmitting,
    card,
    attributes,
    listeners,
  } = props;
  const { user } = useAuth();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { activeTeam, teamMembers } = useStackRef();
  const itemRef = useRef(null);
  const textFieldRef = useRef(null);
  const gravatarRef = useRef(null);

  const [editOpen, setEditOpen] = useState(false);
  const [openOwner, setOpenOwner] = useState(false);
  const [itemTitle, setItemTitle] = useState();

  const isActive = activeCard?.kanban_item_uuid === card.kanban_item_uuid;

  useEffect(() => {
    setItemTitle(card.kanban_item_details?.item_title);
  }, [card.kanban_item_details]);

  const handleChangeTitle = (event) => {
    if (editOpen) {
      setEditOpen(false);
      if (itemTitle !== card.kanban_item_details?.item_title) {
        handleTitleChange();
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        textFieldRef.current &&
        !textFieldRef.current.contains(event.target) &&
        editOpen
      ) {
        setEditOpen(false);
        setItemTitle(card.kanban_item_details?.item_title);
      }
    };

    const handleKeyDown = async (event) => {
      if (editOpen && textFieldRef.current && event.key === 'Escape') {
        setEditOpen(false);
        setItemTitle(card.kanban_item_details?.item_title);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editOpen, itemTitle, card.kanban_item_details?.item_title]);

  const submitKanbanStatusChange = async (details) => {
    const { newStatusId } = details;

    setSubmitting(true);
    const payload = {};
    payload['user'] = user;
    payload['action'] = 'move';
    payload['team_uuid'] = activeTeam?.team_uuid;
    payload['kanban_item_uuid'] = card.kanban_item_uuid;
    payload['kanban_item_status_id'] = newStatusId;
    payload['kanban_item_priority'] = card.kanban_item_priority;

    await dispatch(postKanbanItems(payload))
      .then((data) => {
        dispatch(
          getKanbanItems({ user: user, teamUuid: activeTeam?.team_uuid }),
        );
        toast.success('Card updated', { containerId: 'results' });
      })
      .catch((error) => {
        setSubmitting(false);
        throw new Error(error);
      });
    setSubmitting(false);
  };

  const handleEditOpen = (event) => {
    event.stopPropagation();
    setEditOpen((prevEditOpen) => !prevEditOpen);
  };

  const handleOpenOwner = async (event) => {
    event.stopPropagation();
    setOpenOwner(true);
  };

  const handleCloseOwner = (event) => {
    event.stopPropagation();
    setOpenOwner(false);
  };

  const handleOwnerChange = async (details) => {
    const { kanbanItemUuid, newOwnerUuid } = details;

    setSubmitting(true);
    setOpenOwner(false);

    const payload = {};
    payload['user'] = user;
    payload['action'] = 'update_owner';
    payload['team_uuid'] = activeTeam?.team_uuid;
    payload['kanban_item_uuid'] = kanbanItemUuid;
    payload['kanban_item_owner_uuid'] = newOwnerUuid;

    dispatch(
      reassignKanbanItem({ kanbanItem: card, newOwnerUuid: newOwnerUuid }),
    );
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
    toast.success('Card owner updated', { containerId: 'results' });
    setSubmitting(false);
  };

  const handleTitleChange = async () => {
    setSubmitting(true);
    setOpenOwner(false);

    const payload = {
      user: user,
      action: 'update_title',
      team_uuid: activeTeam?.team_uuid,
      kanban_item_uuid: card.kanban_item_uuid,
      kanban_item_details: {
        item_title: itemTitle,
      },
    };

    dispatch(renameKanbanItem({ kanbanItem: card, newItemTitle: itemTitle }));
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
    toast.success('Card updated', { containerId: 'results' });
    setSubmitting(false);
  };

  return (
    <>
      <Card
        raised={isActive}
        ref={itemRef}
        sx={{
          ...(isActive && {
            backgroundColor: 'background.paper',
          }),
          '&:hover': {
            backgroundColor: 'background.default',
          },
          maxWidth: '100%',
        }}
        variant={isActive ? 'elevation' : 'outlined'}
      >
        <CardContent>
          {editOpen ? (
            <FormControl sx={{ m: 1, width: '100%' }} variant='outlined'>
              <OutlinedInput
                id='outlined-adornment-password'
                maxRows={5}
                multiline
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setItemTitle(event.target.value)}
                ref={textFieldRef}
                value={itemTitle}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      color='primary'
                      onClick={handleChangeTitle}
                      onMouseDown={null}
                      edge='end'
                    >
                      <CheckCircleRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'right',
                  mt: '-15px',
                }}
              >
                <Tooltip title={!isDragging ? 'Drag' : ''} placement='top'>
                  <span>
                    <IconButton
                      {...listeners}
                      {...attributes}
                      disabled={isSubmitting}
                    >
                      <DragIndicatorRoundedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', position: 'relative' }}>
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', mr: '1em' }}
                >
                  {card.kanban_item_status_id !== 999 && (
                    <Tooltip title='Edit' placement='left'>
                      <span>
                        <IconButton
                          disabled={isSubmitting}
                          color='primary'
                          onClick={(event) => {
                            if (!editOpen) {
                              handleEditOpen(event);
                            } else {
                              setCloseTriggeredByClickOutside(false);
                            }
                          }}
                          sx={{ p: 0 }}
                        >
                          <EditNoteRoundedIcon fontSize='small' />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
                <Typography
                  sx={{
                    pr: 3,
                    maxWidth: '100%',
                    whiteSpace: 'pre-line',
                    wordWrap: 'break-word',
                  }}
                >
                  {itemTitle || 'Untitled'}
                </Typography>
              </Box>
            </>
          )}
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              mt: 1,
              '& svg:not(:first-of-type)': {
                ml: 2,
              },
            }}
          >
            <Box sx={{ flexGrow: 1 }} />
            {card.kanban_item_status_id !== 999 && (
              <>
                <Tooltip title='Archive' placement='left'>
                  <div>
                    <IconButton
                      color='primary'
                      disabled={isSubmitting}
                      onClick={() =>
                        submitKanbanStatusChange({ newStatusId: 999 })
                      }
                    >
                      <DeleteRoundedIcon fontSize='small' />
                    </IconButton>
                  </div>
                </Tooltip>
                <Tooltip
                  title={
                    card.kanban_item_owner
                      ? card.kanban_item_owner?.first_name +
                        ' ' +
                        card.kanban_item_owner?.last_name
                      : 'Unassigned'
                  }
                >
                  <div ref={gravatarRef}>
                    <Gravatar
                      onClick={handleOpenOwner}
                      emailAddress={card.kanban_item_owner?.email_address}
                      fullName={
                        card.kanban_item_owner?.first_name +
                        ' ' +
                        card.kanban_item_owner?.last_name
                      }
                    />
                  </div>
                </Tooltip>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
      <Dialog
        open={openOwner}
        onClose={handleCloseOwner}
        PaperProps={{
          style: {
            position: 'fixed',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            px: 2,
            py: 1,
          }}
        >
          Change Owner
        </DialogTitle>
        <Box
          sx={{
            p: 2,
          }}
        >
          <List>
            {teamMembers?.map((teamMember) => {
              return (
                <ListItem
                  key={teamMember.team_member_uuid}
                  onClick={() => {
                    if (
                      !isSubmitting &&
                      teamMember.team_member_uuid !==
                        card.kanban_item_owner?.team_member_uuid
                    )
                      handleOwnerChange({
                        kanbanItemUuid: card.kanban_item_uuid,
                        newOwnerUuid: teamMember.team_member_uuid,
                      });
                  }}
                  sx={{
                    backgroundColor: 'transparent',
                    borderRadius: 1,
                    ':hover': {
                      backgroundColor: (theme) =>
                        darken(theme.palette.background.default, 0.2),
                      cursor: 'pointer',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      overlap='circular'
                      badgeContent={<CheckCircleRoundedIcon fontSize='small' />}
                      invisible={
                        teamMember.team_member_uuid !==
                        card.kanban_item_owner?.team_member_uuid
                      }
                    >
                      <Gravatar
                        emailAddress={teamMember.email_address}
                        fullName={
                          teamMember.first_name + ' ' + teamMember.last_name
                        }
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography display='block' noWrap variant='subtitle2'>
                        {teamMember.first_name} {teamMember.last_name}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
            <ListItem
              key={'unassigned'}
              onClick={() => {
                if (!isSubmitting && card.kanban_item_owner?.team_member_uuid)
                  handleOwnerChange({
                    kanbanItemUuid: card.kanban_item_uuid,
                    newOwnerUuid: null,
                  });
              }}
              sx={{
                backgroundColor: 'transparent',
                borderRadius: 1,
                ':hover': {
                  backgroundColor: (theme) =>
                    darken(theme.palette.background.default, 0.2),
                  cursor: 'pointer',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  overlap='circular'
                  badgeContent={<CheckCircleRoundedIcon fontSize='small' />}
                  invisible={
                    card.kanban_item_owner?.team_member_uuid ? true : false
                  }
                >
                  <Avatar />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                disableTypography
                primary={
                  <Typography
                    display='block'
                    noWrap
                    variant='subtitle2'
                    sx={{ fontStyle: 'italic' }}
                  >
                    Unassigned
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Box>
      </Dialog>
    </>
  );
};

const KanbanCard = (props) => {
  const {
    activeCard,
    card,
    isSubmitting,
    isDragging,
    setSubmitting,
    ...other
  } = props;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.kanban_item_uuid, disabled: isSubmitting });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        outline: 'none',
        py: 1,
      }}
      {...other}
    >
      <Item
        attributes={attributes}
        listeners={listeners}
        activeCard={activeCard}
        isDragging={isDragging}
        isSubmitting={isSubmitting}
        setSubmitting={setSubmitting}
        card={card}
      />
    </Box>
  );
};

KanbanCard.propTypes = {
  card: PropTypes.object.isRequired,
  //kanbanItems: PropTypes.array.isRequired
};

export default KanbanCard;
