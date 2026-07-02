import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Rating,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import { dateTimeRelative } from 'src/utils/dtmFormatting';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import SportsScoreRoundedIcon from '@mui/icons-material/SportsScoreRounded';
import FeedbackRoundedIcon from '@mui/icons-material/FeedbackRounded';
import AddLinkRoundedIcon from '@mui/icons-material/AddLinkRounded';
import GetEventActivity from 'src/components/stackref/GetEventActivity';

const EventActivityTable = (props) => {
  const { orgEvent, ...other } = props;
  const { user } = useAuth();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(true);
  const [thisEventActivity, setThisEventActivity] = useState(null);
  const { activeOrgEvent, eventActivity, initializeEventActivity } =
    useStackRef();

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );

  const getEventActivity = async () => {
    console.log(`:: getEventActivity: ${thisEvent.event_uuid}`);
    try {
      await GetEventActivity(user, thisEvent.event_uuid)
        .then((data) => {
          try {
            setThisEventActivity(data);
          } catch (error) {
            setThisEventActivity(null);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getEventActivity: ${error}`);
    }
  };

  useEffect(() => {
    async function initialize() {
      try {
        if (orgEvent) {
          await getEventActivity();
        } else {
          await initializeEventActivity();
        }
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orgEvent) {
      setThisEventActivity(eventActivity);
    }
  }, [eventActivity, orgEvent]);

  return (
    <Card {...other}>
      <CardHeader
        title='Event Activity'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <TableContainer>
          <Table aria-labelledby='tableTitle' size='small'>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Timestamp
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Activity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ) : (
                thisEventActivity?.event_activity?.map((row, index) => {
                  return (
                    <TableRow key={row.activity_uuid}>
                      <TableCell>{dateTimeRelative(row.timestamp)}</TableCell>
                      <TableCell
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                        }}
                      >
                        {row.activity_type === 'event' && (
                          <EventAvailableRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}
                        {row.activity_type === 'team_analysis_result' && (
                          <AssessmentRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}
                        {row.activity_type === 'coin_ledger' && (
                          <AccountBalanceRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}
                        {row.activity_type === 'team_score_item' && (
                          <SportsScoreRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}
                        {row.activity_type === 'team_event_feedback' && (
                          <FeedbackRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}
                        {row.activity_type === 'team_external_link' && (
                          <AddLinkRoundedIcon
                            color='primary'
                            fontSize='small'
                            sx={{ mr: 1 }}
                          />
                        )}

                        {row.activity_type === 'event' &&
                          `Event set to ${row.activity_details.event_status_name}!`}
                        {row.activity_type === 'team_analysis_result' &&
                          `Team '${row.activity_details.team_name}' received a code analysis result from ${row.activity_details.team_analysis_result_source}!`}
                        {row.activity_type === 'coin_ledger' &&
                          row.activity_details.receiving_entity_uuid ===
                            thisEvent.event_uuid &&
                          'The Event received StackCash!'}
                        {row.activity_type === 'coin_ledger' &&
                          row.activity_details.sending_entity_uuid ===
                            thisEvent.event_uuid &&
                          'A Team received StackCash!'}
                        {row.activity_type === 'team_score_item' && (
                          <Box sx={{ display: 'flex' }}>
                            Team '{row.activity_details.team_name}' received a
                            judge's '
                            {row.activity_details.judging_criterion_name}' score
                            of{' '}
                            <Rating
                              readOnly
                              max={Math.ceil(
                                row.activity_details.team_score_item_value,
                              )}
                              precision={0.5}
                              value={row.activity_details.team_score_item_value}
                            />
                            !
                          </Box>
                        )}
                        {row.activity_type === 'team_event_feedback' &&
                          `Team '${row.activity_details.team_name}' received a judge's feedback!`}
                        {row.activity_type === 'team_external_link' &&
                          `Team '${row.activity_details.team_name}' added an external link for judging.`}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

/*
TeamMemberListTable.propTypes = {
  teamMembers: PropTypes.array.isRequired
};
*/

export default EventActivityTable;
