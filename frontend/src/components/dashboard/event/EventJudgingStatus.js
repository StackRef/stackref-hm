import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetEvents from 'src/components/stackref/GetEvents';
import EventEdit from 'src/components/dashboard/admin/EventEdit';
import { useTheme } from '@mui/material/styles';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoadingScreen from 'src/components/LoadingScreen';
import { toast } from 'react-toastify';
import { useConfirm } from 'material-ui-confirm';
import { useNavigate } from 'react-router-dom';
import TeamAvatar from 'src/components/dashboard/team/TeamAvatar';
import HelpIcon from '@mui/icons-material/Help';

const EventJudgingStatus = (props) => {
  const { orgEvent } = props;
  const { user } = useAuth();
  const {
    activeOrgEvent,
    initializeOrgEvents,
    judgingCriteria,
    participants,
    teams,
  } = useStackRef();
  const [allTeamsScoreItems, setAllTeamsScoreItems] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  const theme = useTheme();
  const navigate = useNavigate();

  console.log(':: EventJudgingStatus');

  const setEventComplete = async () => {
    console.log(':: setEventComplete');
    const payload = {};
    payload['user'] = user;
    payload['action'] = 'complete';
    payload['event_uuid'] = activeOrgEvent.event_uuid;
    setSubmitting(true);

    try {
      await EventEdit(payload, async (error, response) => {
        if (error) {
          throw `Event update failed: ${error.error}`;
        }
        initializeOrgEvents();
        setSubmitting(false);
        toast.success('Event set to completed', { containerId: 'results' });
        navigate(`/dashboard/event/${activeOrgEvent.event_uuid}`);
      }).catch((error) => {
        throw error;
      });
    } catch (error) {
      console.error(`>> setEventComplete: ${error}`);
      toast.error(error.message, { containerId: 'results' });
      setSubmitting(false);
    }
  };

  const CompleteEvent = () => {
    const completeScoreItemCount = allTeamsScoreItems
      .map((tsi) =>
        tsi.judging_status
          ?.map(
            (js) =>
              js.team_score_items?.filter((_tsi) => _tsi.team_score_item_uuid)
                ?.length,
          )
          .reduce((a, v) => (a = a + v), 0),
      )
      .reduce((a, v) => (a = a + v), 0);

    const incompleteScoreItemCount = allTeamsScoreItems
      .map((tsi) =>
        tsi.judging_status
          ?.map(
            (js) =>
              js.team_score_items?.filter((_tsi) => !_tsi.team_score_item_uuid)
                ?.length,
          )
          .reduce((a, v) => (a = a + v), 0),
      )
      .reduce((a, v) => (a = a + v), 0);

    return (
      <Grid
        container
        spacing={4}
        sx={{
          mb: 2,
        }}
      >
        <Grid item>
          <Typography color='primary' component='div'>
            <Typography color='success.main' display='inline'>
              {completeScoreItemCount ? completeScoreItemCount : 0}
            </Typography>{' '}
            scores submitted
          </Typography>
          <Typography color='primary' component='div'>
            <Typography color={theme.palette.text.primary} display='inline'>
              {incompleteScoreItemCount ? incompleteScoreItemCount : 0}
            </Typography>{' '}
            scores outstanding
          </Typography>
        </Grid>
        <Grid item>
          {activeOrgEvent?.event_status_name !== 'Complete' && (
            <>
              <LoadingButton
                loading={isSubmitting}
                onClick={async () => {
                  confirm({
                    title: 'Set event to complete?',
                    content: `This will end the judging phase of the event${
                      activeOrgEvent.event_details?.event_name
                        ? ' "' + activeOrgEvent.event_details.event_name + '"'
                        : null
                    }. This action is non-reversible.`,
                    confirmationText: 'OK',
                    dialogProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: theme.palette.background.default,
                        },
                      },
                    },
                    titleProps: {
                      sx: {
                        color: theme.palette.text.primary,
                        fontFamily: theme.typography.fontFamily,
                      },
                    },
                    contentProps: {
                      sx: {
                        color: theme.palette.text.primary,
                        fontFamily: theme.typography.fontFamily,
                      },
                    },
                    confirmationButtonProps: {
                      autoFocus: true,
                      variant: 'contained',
                    },
                    cancellationButtonProps: {
                      variant: 'outlined',
                    },
                  })
                    .then(() => setEventComplete())
                    .catch((error) =>
                      console.error(`:: setEventComplete: ${error}`),
                    );
                }}
                variant='contained'
              >
                Complete Event
              </LoadingButton>
              <Tooltip title='Use this to complete the judging phase of an event earlier than its pre-set time. This action is non-reversible.'>
                <HelpIcon sx={{ color: 'text.primary' }} />
              </Tooltip>
            </>
          )}
        </Grid>
      </Grid>
    );
  };

  const getEventJudgingStatus = useCallback(async () => {
    console.log(':: getEventJudgingStatus');
    if (activeOrgEvent) {
      try {
        await GetEvents(user, activeOrgEvent.event_uuid, 'judging_status')
          .then((data) => {
            try {
              if (data) {
                setAllTeamsScoreItems(data);
              }
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> getEventJudgingStatus: ${err}`);
      } finally {
        setLoading(false);
      }
    }
  }, [activeOrgEvent, user]);

  useEffect(() => {
    getEventJudgingStatus();
  }, [getEventJudgingStatus]);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <>
      <CompleteEvent />
      {allTeamsScoreItems.map((tsi, index) => {
        const thisTeam = teams?.find((t) => t.team_uuid === tsi.team_uuid);
        return (
          <Card
            key={tsi.team_uuid}
            sx={{
              mt: index !== 0 ? 2 : 0,
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: 'flex' }}>
                  <TeamAvatar
                    teamUuid={thisTeam.team_uuid}
                    assetUuid={thisTeam.avatar_image_uuid}
                    sx={{ mr: 1 }}
                  />
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <Typography color='text.primary' variant='h6'>
                      Team:
                    </Typography>
                    <Typography sx={{ ml: 1 }} variant='h6'>
                      {thisTeam?.team_details?.team_name || '??'}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                py: 1,
              }}
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: theme.palette.background.tableHead,
                      }}
                    >
                      <TableCell>Judge</TableCell>
                      {judgingCriteria?.map((jc) => {
                        return (
                          <TableCell key={jc.judging_criterion_uuid}>
                            {jc.criterion_details?.criterion_name}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tsi.judging_status?.map((js) => {
                      return (
                        <TableRow key={js.judge_uuid}>
                          <TableCell>
                            {
                              participants?.find(
                                (p) => p.participant_uuid === js.judge_uuid,
                              )?.first_name
                            }{' '}
                            {
                              participants?.find(
                                (p) => p.participant_uuid === js.judge_uuid,
                              )?.last_name
                            }
                          </TableCell>
                          {js.team_score_items?.map((tsi) => {
                            return (
                              <TableCell key={tsi.judging_criterion_uuid}>
                                {tsi.team_score_item_uuid ? (
                                  <Tooltip title='Score Submitted'>
                                    <CheckCircleIcon
                                      sx={{
                                        color: 'success.main',
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title='No Score Submitted'>
                                    <CircleIcon />
                                  </Tooltip>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default EventJudgingStatus;
