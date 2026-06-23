import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Link,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { formatDuration, intervalToDuration } from 'date-fns';
import useStackRef from 'src/hooks/useStackRef';
import { dtmFormatted, dtmUtcToLocal } from 'src/utils/dtmFormatting';

const EventPopover = () => {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [open, setOpen] = useState(false);
  const [eventTimeRemaining, setEventTimeRemaining] = useState({});
  // TODO: Change the eventTimeStatus colors to something more meaningful than 'inherit', 'success', and 'error', which are common in the DOM
  const [eventTimeStatus, setEventTimeStatus] = useState('inherit');
  const { activeOrgEvent, initializeUserParticipants } = useStackRef();

  useEffect(() => {
    initializeUserParticipants();
    setEventTimeStatus('inherit');
    setEventTimeRemaining({});
  }, [initializeUserParticipants]);

  const RenderTimeRemaining = useCallback(() => {
    if (activeOrgEvent?.event_uuid) {
      const now = new Date();
      const tsEventStart = dtmUtcToLocal(activeOrgEvent.ts_event_start);
      const tsEventEnd = dtmUtcToLocal(activeOrgEvent.ts_event_end);
      const judgingMins = activeOrgEvent?.event_judging_minutes;
      let start = new Date().getTime();
      let end = new Date(tsEventEnd).getTime();
      let judgingEnd = new Date(end + judgingMins * 60 * 1000).getTime();

      if (
        activeOrgEvent?.event_status_name === 'Complete' ||
        now > judgingEnd
      ) {
        // Event has ended
        setEventTimeStatus('error');
        start = now;
        end = now;
      } else if (
        activeOrgEvent?.event_status_name === 'Judging' ||
        (judgingEnd > now && end < now)
      ) {
        // Event in Judging
        setEventTimeStatus('warning');
        start = now;
        end = judgingEnd;
      } else if (tsEventStart > now) {
        // Upcoming event
        setEventTimeStatus('inherit');
        start = now;
        end = tsEventStart;
      }

      // Warning when time remaining is less than 5m (300000ms)
      else if (tsEventEnd - now < 300000) {
        setEventTimeStatus('error');
      } else {
        start = now;
        end = tsEventEnd;
        setEventTimeStatus('success');
      }
      setEventTimeRemaining(
        intervalToDuration({
          start: start,
          end: end,
        }),
      );
    } else {
      setEventTimeRemaining({});
      setEventTimeStatus('inherit');
    }
  }, [activeOrgEvent]);

  useEffect(() => {
    RenderTimeRemaining();
  }, [RenderTimeRemaining]);

  useEffect(() => {
    const delay = 1000; // 1 second
    const timer = setInterval(() => {
      if (eventTimeStatus !== 'ended') {
        RenderTimeRemaining();
      }
    }, delay);
    return () => clearInterval(timer);
  }, [RenderTimeRemaining, eventTimeStatus]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChooseEvent = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title='Event Details'>
        <Button
          onClick={handleOpen}
          ref={anchorRef}
          sx={{
            color:
              eventTimeStatus === 'inherit'
                ? 'inherit'
                : theme.palette[eventTimeStatus].main,
            flexDirection: 'column',
          }}
        >
          {eventTimeStatus === 'warning' ? (
            <GavelRoundedIcon
              sx={{ fontSize: '1.5rem', mb: theme.spacing.unit }}
            />
          ) : (
            <EventRoundedIcon
              sx={{ fontSize: '1.5rem', mb: theme.spacing.unit }}
            />
          )}
          <Typography
            sx={{
              color:
                eventTimeStatus === 'inherit'
                  ? 'inherit'
                  : theme.palette[eventTimeStatus].main,
              fontSize: '12px',
            }}
          >
            {activeOrgEvent?.event_uuid && eventTimeRemaining
              ? `${eventTimeRemaining.days || 0}D:${
                  eventTimeRemaining.hours || 0
                }H:${eventTimeRemaining.minutes || 0}M:${
                  eventTimeRemaining.seconds || 0
                }S`
              : ''}
          </Typography>
        </Button>
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
            title='Event Details'
            subheader={
              activeOrgEvent?.event_details?.event_name ? (
                <Typography variant='body2' color='textPrimary'>
                  {activeOrgEvent.event_details.event_name}
                </Typography>
              ) : null
            }
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              py: 1,
            }}
          />
          <CardContent>
            {!activeOrgEvent?.event_uuid ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography sx={{ color: 'text.secondary' }}>
                  Not in an active event
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                <ListItem disableGutters key='eventStart'>
                  <ListItemText
                    primary='Event Start'
                    secondary={dtmFormatted(activeOrgEvent.ts_event_start)}
                  />
                </ListItem>
                <ListItem disableGutters key='eventEnd'>
                  <ListItemText
                    primary='Event End'
                    secondary={dtmFormatted(activeOrgEvent.ts_event_end)}
                  />
                </ListItem>
                {eventTimeRemaining && formatDuration(eventTimeRemaining) ? (
                  <ListItem disableGutters key='timeRemaining'>
                    <ListItemText
                      primary={
                        eventTimeStatus === 'inherit'
                          ? 'Time Remaining (to start)'
                          : 'Time Remaining (to end)'
                      }
                      secondary={formatDuration(eventTimeRemaining)}
                    />
                  </ListItem>
                ) : null}
              </List>
            )}
          </CardContent>
          <CardActions
            sx={{
              justifyContent: 'center',
            }}
          >
            <Link
              component={RouterLink}
              to={
                !activeOrgEvent
                  ? '/dashboard/organization/events'
                  : '/dashboard/event'
              }
              sx={{ textDecoration: 'none' }}
            >
              <Button variant='contained' onClick={handleChooseEvent}>
                {!activeOrgEvent?.event_uuid ? 'Choose Event' : 'View Event'}
              </Button>
            </Link>
          </CardActions>
        </Card>
      </Popover>
    </>
  );
};

export default EventPopover;
