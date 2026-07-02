import { useCallback, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Divider,
  Button,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CloudCircleRounded,
  EventAvailableRounded,
  GavelRounded,
  Groups2Rounded,
  MarkEmailReadRounded,
  MessageRounded,
  SettingsRounded,
  ScheduleRounded,
  ViewKanbanRounded,
} from '@mui/icons-material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { useSelector } from 'src/store';
import useWebSocket from 'src/hooks/useWebSocket';
import dayjs from 'dayjs';

const iconsMap = {
  game_time: ScheduleRounded,
  new_message: MessageRounded,
  event_status: EventAvailableRounded,
  team_status: Groups2Rounded,
  judging_status: GavelRounded,
  resource_created: SettingsRounded,
  resource_terminated: SettingsRounded,
  cloud_account: CloudCircleRounded,
  kanban: ViewKanbanRounded,
  invitation_file: MarkEmailReadRounded,
};

const NotificationsPopover = () => {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const notifications = useSelector((state) => state.notifications.data);
  const { socket } = useWebSocket();

  //console.log(':: NotificationsPopover');

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const readAllNotifications = useCallback(() => {
    if (socket?.readyState === 1) {
      console.log(':: Setting all notifications as read');
      socket.send(`{
        "action": "set_read",
        "notifications": ${JSON.stringify(notifications)}
      }`);
    }
  }, [notifications, socket]);

  const unreadCount = useMemo(() => {
    let _unreadCount = 0;
    notifications.forEach((notification) => {
      const isRead = notification.is_read;
      if (!isRead) _unreadCount = _unreadCount + 1;
    });
    return _unreadCount;
  }, [notifications]);

  return (
    <>
      <Tooltip title='Notifications'>
        <IconButton color='inherit' ref={anchorRef} onClick={handleOpen}>
          <Badge
            color='error'
            badgeContent={unreadCount}
            invisible={unreadCount > 0 ? false : true}
          >
            <NotificationsRoundedIcon />
          </Badge>
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
            title='Notifications'
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              py: 1,
            }}
          />
          <CardActions
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 1,
            }}
          >
            <Button
              color='primary'
              onClick={readAllNotifications}
              disabled={!socket || unreadCount < 1}
              size='small'
              variant='text'
            >
              Mark all as read
            </Button>
          </CardActions>
          <Divider />
          <CardContent>
            {notifications?.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography color='text.secondary' variant='subtitle2'>
                  There are no notifications
                </Typography>
              </Box>
            ) : (
              <>
                <List disablePadding>
                  {notifications?.map((notification) => {
                    const content = JSON.parse(
                      notification.content?.S || notification.content,
                    );
                    const notificationUuid =
                      notification.notification_uuid?.S ||
                      notification.notification_uuid;
                    const isRead =
                      notification.is_read?.BOOL || notification.is_read;
                    const timestamp =
                      notification.timestamp?.N || notification.timestamp;
                    const Icon =
                      content.type && iconsMap[content.type]
                        ? iconsMap[content.type]
                        : iconsMap['new_message'];

                    const timestampUnix = dayjs.unix(timestamp);
                    const formattedTimestamp =
                      timestampUnix.format('YYYY-MM-DD h:mm A');

                    return (
                      <ListItem divider key={notificationUuid}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: isRead
                                ? 'background.primary'
                                : 'primary.main',
                              color: 'primary.contrastText',
                            }}
                          >
                            <Icon fontSize='small' />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Link
                              color='textPrimary'
                              sx={{ cursor: 'pointer' }}
                              underline='none'
                              variant='subtitle2'
                            >
                              {content.title || ''}
                            </Link>
                          }
                          secondary={
                            <>
                              <Typography component='span'>
                                {content.description}
                              </Typography>
                              <Typography
                                component='span'
                                variant='caption'
                                sx={{ display: 'block' }}
                              >
                                {formattedTimestamp}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};

export default NotificationsPopover;
