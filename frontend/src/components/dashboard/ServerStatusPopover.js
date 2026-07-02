import { useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import useWebSocket from 'src/hooks/useWebSocket';

const ServerStatusPopover = () => {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { joinedRooms, socket } = useWebSocket();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title='Server Status'>
        <IconButton
          color={!socket ? 'error' : 'success'}
          onClick={handleOpen}
          ref={anchorRef}
        >
          <BoltIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorRef.current}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            sx: {
              width: 320,
            },
          },
        }}
      >
        <Card>
          <CardHeader
            title='StackRef Server Status'
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              py: 1,
            }}
          />
          <CardContent>
            <List disablePadding dense={true}>
              <ListItem disableGutters key='socket'>
                <ListItemText
                  primary='Tator'
                  secondary={socket ? 'Connected' : 'Disconnected'}
                />
              </ListItem>
              {joinedRooms ? (
                <ListItem disableGutters key='joinedRooms'>
                  <ListItemText
                    primary='Joined Rooms'
                    secondary={joinedRooms.map(
                      (room, index) => (index ? ', ' : '') + room.roomName,
                    )}
                  />
                </ListItem>
              ) : null}
            </List>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};

export default ServerStatusPopover;
