import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Step, StepConnector, Stepper, StepLabel } from '@mui/material';
import useStackRef from 'src/hooks/useStackRef';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import SportsScoreRoundedIcon from '@mui/icons-material/SportsScoreRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import { dtmUtcToLocal } from 'src/utils/dtmFormatting';
import PulsingBadge from 'src/icons/PulsingBadge';

const EventTimeline = (props) => {
  const { orgEvent, ...other } = props;
  const { activeOrgEvent, initializeEventActivity } = useStackRef();
  const [eventTimeStatus, setEventTimeStatus] = useState();
  const [eventStep, setEventStep] = useState(0);

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  const RenderTimeRemaining = useCallback(() => {
    const now = new Date();
    const tsEventStart = dtmUtcToLocal(thisEvent?.ts_event_start);
    const tsEventEnd = dtmUtcToLocal(thisEvent?.ts_event_end);
    const judgingMins = thisEvent?.event_judging_minutes;

    let start = new Date(tsEventStart).getTime();
    let end = new Date(tsEventEnd).getTime();
    let judgingEnd = new Date(end + judgingMins * 60 * 1000).getTime();
    let val = 0;
    let newEventTimeStatus = eventTimeStatus;

    if (thisEvent?.event_status_name === 'Complete' || now > judgingEnd) {
      // Event has ended
      newEventTimeStatus = 'ended';
      setEventStep(3);
      start = 0;
      end = 0;
    } else if (
      thisEvent?.event_status_name === 'Judging' ||
      (judgingEnd > now && end < now)
    ) {
      // Event in Judging
      newEventTimeStatus = 'judging';
      setEventStep(2);
      start = new Date(now).getTime();
      end = judgingEnd;
      val = (end - start) / 1000;
    } else if (tsEventStart > now) {
      // Upcoming event
      newEventTimeStatus = 'upcoming';
      setEventStep(0);
      start = new Date().getTime();
      end = new Date(tsEventStart).getTime();
      val = (end - start) / 1000;
    } else {
      // Event running
      newEventTimeStatus = 'running';
      setEventStep(1);
      start = new Date(now).getTime();
      end = new Date(tsEventEnd).getTime();
      val = (end - start) / 1000;
    }

    if (newEventTimeStatus !== eventTimeStatus) {
      initializeEventActivity(thisEvent.event_uuid);
    }

    setEventTimeStatus(newEventTimeStatus);
  }, [eventTimeStatus, initializeEventActivity, thisEvent]);

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

  const TimelineIcon = (status) => {
    let IconComponent = FlagRoundedIcon;
    let iconFill = 'black';
    let pulsingVariant = 'info';
    let isPulsing = false;

    if (status === 'upcoming') {
      IconComponent = PauseCircleOutlineRoundedIcon;
      iconFill = eventStep > 0 ? 'white' : 'black';
      pulsingVariant = 'info';
      isPulsing = eventTimeStatus !== 'upcoming' ? false : true;
    }

    if (status === 'running') {
      IconComponent = FlagRoundedIcon;
      iconFill = eventStep > 1 ? 'white' : 'black';
      pulsingVariant = eventTimeStatus === 'running' ? 'running' : 'info';
      isPulsing = eventTimeStatus !== 'running' ? false : true;
    }

    if (status === 'judging') {
      IconComponent = GavelRoundedIcon;
      iconFill = eventStep > 2 ? 'white' : 'black';
      pulsingVariant = eventTimeStatus === 'judging' ? 'judging' : 'info';
      isPulsing = eventTimeStatus !== 'judging' ? false : true;
    }

    if (status === 'ended') {
      IconComponent = SportsScoreRoundedIcon;
      iconFill = 'black';
      pulsingVariant = eventTimeStatus === 'ended' ? 'complete' : 'info';
      isPulsing = eventTimeStatus !== 'ended' ? false : true;
    }

    return (
      <Box
        sx={{
          position: 'relative',
          alignItems: 'center',
          borderRadius: '50%',
          display: 'flex',
          height: 50,
          justifyContent: 'center',
          width: 50,
        }}
      >
        <PulsingBadge
          size='30px'
          pulsing={isPulsing}
          variant={pulsingVariant}
        />
        <IconComponent
          sx={{
            fill: iconFill,
            position: 'absolute',
            zIndex: 1,
          }}
        />
      </Box>
    );
  };

  const CustomConnector = (props) => (
    <StepConnector
      {...props}
      sx={{
        '& .MuiStepConnector-line': {
          borderStyle: 'dashed',
          borderWidth: '2px',
          mt: 1.5,
        },
        '&.Mui-active .MuiStepConnector-line': {
          borderStyle: 'solid',
        },
      }}
    />
  );

  return !thisEvent ? null : (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Stepper
        connector={<CustomConnector />}
        sx={{ width: '80%' }}
        alternativeLabel
      >
        <Step active={eventStep >= 0}>
          <StepLabel StepIconComponent={() => TimelineIcon('upcoming')}>
            Preparing
          </StepLabel>
        </Step>
        <Step active={eventStep > 0}>
          <StepLabel StepIconComponent={() => TimelineIcon('running')}>
            Running
          </StepLabel>
        </Step>
        <Step active={eventStep > 1}>
          <StepLabel StepIconComponent={() => TimelineIcon('judging')}>
            Judging
          </StepLabel>
        </Step>
        <Step active={eventStep > 2}>
          <StepLabel StepIconComponent={() => TimelineIcon('ended')}>
            Finish
          </StepLabel>
        </Step>
      </Stepper>
    </Box>
  );
};

export default EventTimeline;
