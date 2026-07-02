import { useMemo } from 'react';
import { Box, Card, CardContent, CardHeader } from '@mui/material';
import useStackRef from 'src/hooks/useStackRef';
import { useTheme } from '@mui/material/styles';
import EventParticipantListTable from './EventParticipantListTable';

const EventParticipantsList = (options) => {
  const theme = useTheme();
  const { activeOrgEvent } = useStackRef();
  const { orgEvent } = options;

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Card sx={{ width: '60%' }}>
        <CardHeader
          title='Event Participants'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            py: 1,
          }}
        />
        <CardContent key='cc'>
          <EventParticipantListTable key='ept' thisEvent={thisEvent} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventParticipantsList;
