import { useCallback, useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import useStackRef from 'src/hooks/useStackRef';
import { dtmUtcToLocal } from 'src/utils/dtmFormatting';

const EventTimeRemainingChart = (props) => {
  const [eventTimeStatus, setEventTimeStatus] = useState();
  const [eventPctRemaining, setEventPctRemaining] = useState(0);
  const [eventTimeLabel, setEventTimeLabel] = useState('');
  const { activeOrgEvent } = useStackRef();
  const { orgEvent, ...other } = props;

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  const chart = useMemo(() => {
    return {
      series: [eventPctRemaining],
      options: {
        chart: {
          height: 280,
          type: 'radialBar',
        },
        colors: [
          eventPctRemaining < 10
            ? 'red'
            : eventPctRemaining < 25
              ? 'yellow'
              : 'green',
        ],
        plotOptions: {
          radialBar: {
            hollow: {
              margin: 0,
              size: '70%',
            },
            track: {
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                blur: 4,
                opacity: 0.15,
              },
            },
            dataLabels: {
              name: {
                offsetY: 10,
                color: '#fff',
                fontSize: '30px',
              },
              value: {
                show: false,
              },
            },
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            gradientToColors: [
              eventPctRemaining < 10
                ? 'red'
                : eventPctRemaining < 25
                  ? 'yellow'
                  : 'green',
            ],
            stops: [0, 100],
          },
        },
        stroke: {
          lineCap: 'round',
        },
        labels: [eventTimeLabel],
      },
    };
  }, [eventPctRemaining, eventTimeLabel]);

  const RenderTimeRemaining = useCallback(
    (msOnPage = 1000) => {
      const now = new Date();
      const tsEventStart = dtmUtcToLocal(thisEvent?.ts_event_start);
      const tsEventEnd = dtmUtcToLocal(thisEvent?.ts_event_end);
      const judgingMins = thisEvent?.event_judging_minutes;

      let start = new Date(tsEventStart).getTime();
      let end = new Date(tsEventEnd).getTime();
      let judgingEnd = new Date(end + judgingMins * 60 * 1000).getTime();
      let val = 0;
      let pctRemaining = 0;

      if (thisEvent?.event_status_name === 'Complete' || now > judgingEnd) {
        // Event has ended
        setEventTimeStatus('ended');
        start = 0;
        end = 0;
      } else if (
        thisEvent?.event_status_name === 'Judging' ||
        (judgingEnd > now && end < now)
      ) {
        // Event in Judging
        setEventTimeStatus('judging');
        start = new Date(now).getTime();
        end = judgingEnd;
        val = (end - start) / 1000;
        pctRemaining =
          ((start - end) /
            (end - new Date(end + judgingMins * 60 * 1000).getTime())) *
          100;
      } else if (tsEventStart > now) {
        // Upcoming event
        setEventTimeStatus('upcoming');
        start = new Date().getTime();
        end = new Date(tsEventStart).getTime();
        val = (end - start) / 1000;
        //pctRemaining = msOnPage / (end - start) * 100; // This may be incorrect
        pctRemaining = ((end - start) / (end - start + msOnPage)) * 100;
      } else {
        // Event running
        setEventTimeStatus('running');
        start = new Date(now).getTime();
        end = new Date(tsEventEnd).getTime();
        val = (end - start) / 1000;
        pctRemaining =
          ((end - start) / (end - new Date(tsEventStart).getTime())) * 100;
      }

      setEventPctRemaining(pctRemaining);

      if (val > 86400) setEventTimeLabel(`${Math.round(val / 86400)} Days`);
      else if (val > 3600)
        setEventTimeLabel(
          `${Math.round(val / 3600)} Hour${
            Math.round(val / 3600) > 1 ? 's' : ''
          }`,
        );
      else if (val > 60)
        setEventTimeLabel(
          `${Math.round(val / 60)} Min${Math.round(val / 60) > 1 ? 's' : ''}`,
        );
      else if (val > 0)
        setEventTimeLabel(
          `${Math.round(val)} Sec${Math.round(val) > 1 ? 's' : ''}`,
        );
      else setEventTimeLabel('DONE');
    },
    [thisEvent],
  );

  // Run this on first load so there's no initial delay
  useEffect(() => {
    RenderTimeRemaining();
  }, [RenderTimeRemaining]);

  useEffect(() => {
    const delay = 1000;
    let msOnPage = 0;
    const timer = setInterval(() => {
      if (eventTimeStatus !== 'ended') {
        msOnPage = msOnPage + 1000;
        RenderTimeRemaining(msOnPage);
      }
    }, delay);
    return () => clearInterval(timer);
  }, [RenderTimeRemaining, eventTimeStatus]);

  return (
    <Card {...other}>
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '240px',
        }}
      >
        <Grid container spacing={0}>
          <Grid
            item
            xs={12}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              mt: 7,
              mb: -2,
            }}
          >
            <Typography variant='h5'>
              {eventTimeStatus === 'ended' ? 'Event Ended' : 'Time Remaining'}
            </Typography>
            <Typography variant='h6'>
              {eventTimeStatus === 'upcoming' ? 'To Start' : ''}
              {eventTimeStatus === 'running' ? 'To Judging' : ''}
              {eventTimeStatus === 'judging' ? 'For Judging' : ''}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Chart type='radialBar' {...chart} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EventTimeRemainingChart;
