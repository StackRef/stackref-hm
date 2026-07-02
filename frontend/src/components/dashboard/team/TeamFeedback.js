import { useCallback, useEffect, useState } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetTeamEventFeedback from 'src/components/stackref/GetTeamEventFeedback';
import Editor from 'src/components/dashboard/Editor';

const TeamFeedback = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [teamFeedbackItems, setTeamFeedbackItems] = useState([]);
  const theme = useTheme();
  const { activeTeam } = useStackRef();

  const getTeamFeedback = useCallback(async () => {
    console.log(':: getTeamFeedback');
    try {
      await GetTeamEventFeedback(user, { teamUuid: activeTeam.team_uuid })
        .then((data) => {
          try {
            setTeamFeedbackItems(data);
          } catch (err) {
            setTeamFeedbackItems([]);
            throw err;
          }
          setLoading(false);
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.error(`>> getTeamFeedback: ${err}`);
    }
  }, [activeTeam, user]);

  useEffect(() => {
    async function initialize() {
      if (activeTeam) await getTeamFeedback();
    }
    initialize();
  }, [activeTeam, getTeamFeedback]);

  return (
    <Card {...other}>
      <CardHeader
        title='Judge Feedback'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      >
        Judge Feedback
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Box
            sx={{
              p: 2,
            }}
          >
            <Skeleton height={60} />
          </Box>
        ) : !teamFeedbackItems || teamFeedbackItems.length === 0 ? (
          <Box
            sx={{
              p: 2,
            }}
          >
            <Typography sx={{ fontStyle: 'italic' }}>
              No feedback received yet
            </Typography>
          </Box>
        ) : (
          teamFeedbackItems.map((teamFeedback) => (
            <Box
              key={teamFeedback.team_event_feedback_uuid}
              sx={{
                my: 1,
              }}
            >
              <Editor editorState={teamFeedback?.feedback_text} />
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TeamFeedback;
