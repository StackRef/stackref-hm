import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import EventActivityTable from './EventActivityTable';
import EventLeaderBoard from './EventLeaderBoard';
import EventTimeline from './EventTimeline';
import GetTeams from 'src/components/stackref/GetTeams';

const EventResults = (props) => {
  const { orgEvent, ...other } = props;
  const { user } = useAuth();
  const { activeOrgEvent } = useStackRef();
  const [teamRankings, setTeamRankings] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [eventTeams, setEventTeams] = useState();

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  const getEventTeams = async () => {
    console.log(`:: getEventTeams: ${thisEvent.event_uuid}`);
    try {
      await GetTeams(user, thisEvent.event_uuid)
        .then((data) => {
          try {
            setEventTeams(data); // TODO: API always returns an array even when single. Return object instead and not use [0]
          } catch (error) {
            setEventTeams(null);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getEventTeams: ${error}`);
    }
  };

  useEffect(() => {
    async function initialize() {
      try {
        await getEventTeams();
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ my: 2 }}>
        <EventTimeline orgEvent={orgEvent} />
      </Box>
      {eventTeams?.length < 1 ? (
        <Paper
          sx={{
            p: 2,
          }}
        >
          <Box>
            <Typography>
              No teams {orgEvent ? 'were created' : 'have been created yet'}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <EventLeaderBoard
          orgEvent={orgEvent}
          eventTeams={eventTeams}
          sx={{ mt: 2 }}
        />
      )}
      <Box>
        <EventActivityTable
          orgEvent={orgEvent}
          sx={{
            mt: 2,
          }}
        />
      </Box>
    </Box>
  );
};

export default EventResults;
