import { useMemo, useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import { Box, Card, Grid, List, ListItem, Typography } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import {
  alpha,
  experimentalStyled,
  styled,
  useTheme,
} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CalendarToolbar from 'src/components/dashboard/calendar/CalendarToolbar';
import gtm from 'src/lib/gtm';
import { closeModal } from 'src/slices/calendar';
import { useDispatch } from 'src/store';
import useStackRef from 'src/hooks/useStackRef';
import PulsingBadge from 'src/icons/PulsingBadge';
import { format } from 'date-fns';
import { dtmFormatted } from 'src/utils/dtmFormatting';
import EventBanner from 'src/components/dashboard/event/EventBanner';

const selectedEventSelector = (state) => {
  const { events, selectedEventId } = state.calendar;

  if (selectedEventId) {
    return events.find((_event) => _event.id === selectedEventId);
  }

  return null;
};

const FullCalendarWrapper = experimentalStyled('div')(({ theme }) => ({
  '& .fc-license-message': {
    display: 'none',
  },
  '& .fc': {
    '--fc-bg-event-opacity': 1,
    '--fc-border-color': theme.palette.divider,
    '--fc-daygrid-event-dot-width': '10px',
    '--fc-event-text-color': theme.palette.text.primary,
    '--fc-list-event-hover-bg-color': theme.palette.background.default,
    '--fc-neutral-bg-color': theme.palette.background.default,
    '--fc-page-bg-color': theme.palette.background.default,
    '--fc-today-bg-color': alpha(theme.palette.primary.main, 0.25),
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  '& .fc .fc-col-header-cell-cushion': {
    paddingBottom: '10px',
    paddingTop: '10px',
  },
  '& .fc .fc-day-other .fc-daygrid-day-top': {
    color: theme.palette.text.secondary,
  },
  '& .fc-daygrid-event': {
    //borderColor: 'white'
  },
}));

const EventsCalendar = () => {
  const dispatch = useDispatch();
  const { orgEvents } = useStackRef();
  const theme = useTheme();
  const calendarRef = useRef(null);
  const mobileDevice = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(mobileDevice ? 'listWeek' : 'dayGridMonth');

  const BackgroundImage = ({ eventUuid, assetUuid }) => (
    <EventBanner
      eventUuid={eventUuid}
      assetUuid={assetUuid}
      height='200px'
      width='100%'
      sx={{
        maxHeight: '200px',
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
  );

  const HtmlTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} leaveDelay={200} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      maxWidth: 620,
      minWidth: 200,
      overflow: 'hidden',
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9',
    },
  }));

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  const calendarEvents = useMemo(() => {
    return orgEvents?.map((orgEvent) =>
      orgEvent
        ? {
            id: orgEvent.event_uuid,
            allDay: false,
            start: dtmFormatted(orgEvent.ts_event_start, 'YYYY-MM-DD HH:mm:ss'),
            end: dtmFormatted(orgEvent.ts_event_end, 'YYYY-MM-DD HH:mm:ss'),
            title: orgEvent.event_details.event_name,
            summary: orgEvent.event_details.event_summary,
            description: orgEvent.event_details.event_description,
            status: orgEvent.event_status_name,
            banner_image: orgEvent.banner_image_uuid,
            color:
              orgEvent.event_status_name === 'Not Ready' ? '#f44336' : null,
          }
        : {},
    );
  }, [orgEvents]);

  useEffect(() => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();
      const newView = mobileDevice ? 'listWeek' : 'dayGridMonth';

      calendarApi.changeView(newView);
      setView(newView);
    }
  }, [mobileDevice]);

  const handleDateToday = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handleViewChange = (newView) => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.changeView(newView);
      setView(newView);
    }
  };

  const handleDatePrev = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  };

  const handleDateNext = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  };

  const handleEventContent = (arg) => {
    const selectedEvent = calendarEvents.find((ce) => ce.id === arg.event.id);

    return (
      <HtmlTooltip
        title={
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', zIndex: -1 }}>
              <BackgroundImage
                eventUuid={selectedEvent.id}
                assetUuid={selectedEvent.banner_image}
              />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <List>
                <ListItem sx={{ p: 1 }}>
                  <Typography variant='subtitle2'>
                    {selectedEvent.summary}
                  </Typography>
                </ListItem>
                <ListItem sx={{ p: 0 }}>
                  <Typography>
                    Start: {format(arg.event.start, "eee' @ 'p")}
                  </Typography>
                </ListItem>
                <ListItem sx={{ p: 0 }}>
                  <Typography>
                    End: {format(arg.event.end, "eee' @ 'p'")}
                  </Typography>
                </ListItem>
                <ListItem sx={{ p: 0 }}>
                  <Box
                    sx={{
                      mt: 1,
                      mx: 'auto',
                    }}
                  >
                    <PulsingBadge
                      variant={selectedEvent.status}
                      withBorder
                      pulsing={
                        selectedEvent.status === 'Running' ||
                        selectedEvent.status === 'Judging'
                          ? true
                          : false
                      }
                      badgeLabel={selectedEvent.status}
                    />
                  </Box>
                </ListItem>
              </List>
            </div>
          </div>
        }
      >
        <Grid
          container
          spacing={1}
          sx={{
            px: 1,
          }}
        >
          {selectedEvent.status === 'Running' ||
          selectedEvent.status === 'Judging' ? (
            <Grid item>
              <PulsingBadge
                withBorder
                variant={selectedEvent.status}
                pulsing={true}
              />
            </Grid>
          ) : (
            ''
          )}
          <Grid item>
            <Typography variant='subtitle2'>{arg.event.title}</Typography>
          </Grid>
        </Grid>
      </HtmlTooltip>
    );
  };

  const handleModalClose = () => {
    dispatch(closeModal());
  };

  return (
    <>
      <Helmet>
        <title>Calendar | Events | Admin | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          minHeight: '100%',
          py: 1,
        }}
      >
        <Box sx={{ mt: 3 }}>
          <CalendarToolbar
            date={date}
            onDateNext={handleDateNext}
            onDatePrev={handleDatePrev}
            onDateToday={handleDateToday}
            onViewChange={handleViewChange}
            view={view}
          />
        </Box>
        <Card
          sx={{
            mt: 3,
            p: 2,
          }}
        >
          <FullCalendarWrapper>
            <FullCalendar
              dayMaxEventRows={3}
              displayEventEnd={true}
              displayEventTime={true}
              eventContent={handleEventContent}
              eventDisplay='auto'
              eventOverlap={false}
              events={calendarEvents}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              forceEventDuration={true}
              headerToolbar={false}
              height={600}
              initialDate={date}
              initialView={view}
              plugins={[
                dayGridPlugin,
                listPlugin,
                timeGridPlugin,
                timelinePlugin,
              ]}
              ref={calendarRef}
              rerenderDelay={10}
              weekends
            />
          </FullCalendarWrapper>
        </Card>
      </Box>
    </>
  );
};

export default EventsCalendar;
