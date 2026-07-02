import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { useSelector } from 'src/store';
import useWebSocket from 'src/hooks/useWebSocket';
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

const OverviewNotifications = () => {
  const theme = useTheme();
  const notifications = useSelector((state) => state.notifications.data);
  const { socket } = useWebSocket();

  //console.log(':: OverviewNotifications');

  const readAllNotifications = useCallback(() => {
    if (socket?.readyState === 1) {
      socket.send(`{
        "action": "set_read",
        "notifications": ${JSON.stringify(notifications)}
      }`);
    }
  }, [notifications, socket]);

  const unreadCount = useMemo(() => {
    let _unreadCount = 0;
    notifications?.forEach((notification) => {
      const isRead = notification.is_read;
      if (!isRead) _unreadCount = _unreadCount + 1;
    });
    return _unreadCount;
  }, [notifications]);

  const NotificationList = useCallback(() => {
    return notifications?.length === 0 ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Typography color='text.secondary'>
          You have no notifications
        </Typography>
      </Box>
    ) : (
      <>
        <List disablePadding>
          {notifications?.slice(0, 3)?.map((notification) => {
            const content = JSON.parse(
              notification.content?.S || notification.content,
            );
            const notificationUuid =
              notification.notification_uuid?.S ||
              notification.notification_uuid;
            const isRead = notification.is_read?.BOOL || notification.is_read;
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
        <CardActions>
          {unreadCount > 0 && (
            <Button
              color='primary'
              disabled={!socket}
              onClick={readAllNotifications}
              size='small'
              variant='text'
            >
              Mark all as read
            </Button>
          )}
        </CardActions>
      </>
    );
  }, [notifications, readAllNotifications, socket, unreadCount]);

  return (
    <Card>
      <CardHeader
        title='Recent Notifications'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <NotificationList />
      </CardContent>
    </Card>
  );
};

export default OverviewNotifications;
