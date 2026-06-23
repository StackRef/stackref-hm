import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import { StaticDateRangePicker } from '@mui/x-date-pickers-pro/StaticDateRangePicker';
import { styled, useTheme } from '@mui/material/styles';
import EventTimeRemainingChart from './EventTimeRemainingChart';
import Editor from 'src/components/dashboard/Editor';
import LoadingScreen from 'src/components/LoadingScreen';
import EventBanner from './EventBanner';
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import { dtmFormatted } from 'src/utils/dtmFormatting';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import {
  handleEnterEvent,
  handleExitEvent,
  handleRequestToJoin,
} from 'src/components/dashboard/organization/eventEnterExitJoin';
import JudgingCriteriaListTable from './JudgingCriteriaListTable';

const EventOverview = (options) => {
  const { user } = useAuth();
  const { activeOrgEvent, initializeUserParticipants, userParticipants } =
    useStackRef();
  const theme = useTheme();
  const { orgEvent } = options;
  const navigate = useNavigate();
  const [isSubmitting, setSubmitting] = useState(false);

  const StyledStaticDateRangePicker = styled(StaticDateRangePicker)(
    ({ theme }) => ({
      color: theme.palette.common.white,
      borderRadius: 16,
      margin: 'auto',
      minWidth: '220px',
      '& .MuiDateRangePickerDay-day.Mui-disabled': {
        opacity: '1 !important',
      },
      '& .MuiPickersDay-today': {
        color: theme.palette.common.white,
      },
      '& .MuiDateRangePickerDay-rangeIntervalDayHighlightStart button': {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.common.white,
      },
      '& .MuiDateRangePickerDay-rangeIntervalDayHighlightEnd button': {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.common.white,
      },
    }),
  );

  const StackCashButton = styled(Button)(({ theme }) => ({
    color: theme.palette.common.white,
    minWidth: '310px',
    '&:disabled': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
  }));

  const thisEvent = useMemo(
    () => (orgEvent ? orgEvent : activeOrgEvent),
    [orgEvent, activeOrgEvent],
  );
  const eventCoinBalance = useMemo(() => thisEvent?.bank_balance, [thisEvent]);

  function descriptionPlainText(description) {
    if (!description) {
      return '';
    }

    // Recursive function to extract all the 'text' elements
    const extractText = (obj, texts = []) => {
      if (
        obj.children &&
        Array.isArray(obj.children) &&
        obj.children.length > 0
      ) {
        obj.children.forEach((child) => extractText(child, texts));
      }
      if (obj.text) {
        texts.push(obj.text);
      }
      return texts;
    };

    try {
      // Attempt to parse the description as JSON
      const parsedDescription = JSON.parse(description);

      // Calling the recursive function to extract all the 'text' elements
      const allTexts = extractText(parsedDescription.root);

      if (allTexts) {
        return allTexts.map((text, index) => '[p]' + text + '  [/p]').join('');
      } else return '';
    } catch (error) {
      if (error instanceof SyntaxError) {
        // If parsing fails, return the description as-is
        return description;
      } else {
        // If some other error occurs, re-throw it
        throw error;
      }
    }
  }

  return (
    <>
      {!thisEvent ? (
        <LoadingScreen />
      ) : (
        <>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography color='textPrimary' gutterBottom variant='h5'>
              {thisEvent.event_details?.event_name}
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
            }}
          >
            <EventBanner
              eventUuid={thisEvent.event_uuid}
              assetUuid={thisEvent.banner_image_uuid}
            />
          </Box>
          <Grid container spacing={1} justifyContent='space-between'>
            <Grid item xs={12} sm={7} md={8}>
              <Box>
                <Card sx={{ my: 2 }}>
                  <CardHeader
                    title='Summary'
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.background.paper,
                      py: 1,
                    }}
                  />
                  <CardContent>
                    <Typography>
                      {thisEvent.event_details?.event_summary}
                    </Typography>
                  </CardContent>
                </Card>
                <JudgingCriteriaListTable orgEvent={thisEvent} sx={{ mb: 2 }} />
                <Card>
                  <CardHeader
                    title='Description'
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.background.paper,
                      py: 1,
                    }}
                  />
                  <CardContent>
                    {thisEvent.event_details?.event_description?.includes(
                      'root',
                    ) ? (
                      <Editor
                        editorState={thisEvent.event_details.event_description}
                      />
                    ) : (
                      <Typography>None provided</Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Grid>
            <Grid
              item
              xs={5}
              md={4}
              sx={{
                display: 'inline-flex',
                mt: 2,
              }}
            >
              <Grid
                container
                columns={1}
                spacing={2}
                alignItems='top'
                direction='column'
              >
                {thisEvent.event_status_name === 'Complete' ||
                thisEvent.event_time_elapsed ? null : (
                  <Grid item>
                    {!userParticipants ||
                    Object.keys(userParticipants).length === 0 ||
                    userParticipants.findIndex(
                      (participant) =>
                        participant.event_uuid === thisEvent.event_uuid,
                    ) === -1 ? (
                      <Box display='flex' width='315px'>
                        <Button
                          disabled={isSubmitting}
                          variant='outlined'
                          startIcon={<PersonAddAltRoundedIcon />}
                          sx={{ width: '100%' }}
                          onClick={async () => {
                            setSubmitting(true);
                            await handleRequestToJoin({
                              user: user,
                              orgEvent: thisEvent,
                            });
                            await initializeUserParticipants();
                            setSubmitting(false);
                          }}
                        >
                          Request To Join
                        </Button>
                      </Box>
                    ) : userParticipants.findIndex(
                        (participant) =>
                          participant.event_uuid === thisEvent.event_uuid &&
                          participant.participant_roles,
                      ) === -1 ? (
                      <Box
                        display='flex'
                        width='315px'
                        sx={{ justifyContent: 'center' }}
                      >
                        <Button
                          disabled
                          variant='outlined'
                          startIcon={<CheckCircleRoundedIcon />}
                          sx={{ width: '100%' }}
                        >
                          Request Submitted
                        </Button>
                      </Box>
                    ) : thisEvent.event_uuid === activeOrgEvent?.event_uuid ? (
                      <Box
                        display='flex'
                        width='315px'
                        sx={{ justifyContent: 'center' }}
                      >
                        <Button
                          disabled={isSubmitting}
                          variant='outlined'
                          startIcon={<LogoutRoundedIcon />}
                          sx={{ width: '100%' }}
                          onClick={async () => {
                            setSubmitting(true);
                            await handleExitEvent({
                              user: user,
                              orgEvent: thisEvent,
                              userParticipants: userParticipants,
                            });
                            await initializeUserParticipants();
                            navigate(
                              `/dashboard/event/${thisEvent.event_uuid}`,
                            );
                            setSubmitting(false);
                          }}
                        >
                          Exit Event
                        </Button>
                      </Box>
                    ) : (!activeOrgEvent ||
                        thisEvent.event_uuid !== activeOrgEvent.event_uuid) &&
                      (thisEvent.event_status_name === 'Running' ||
                        thisEvent.event_status_name === 'Judging') &&
                      userParticipants.findIndex(
                        (participant) =>
                          participant.event_uuid === thisEvent.event_uuid &&
                          participant.participant_roles,
                      ) !== -1 ? (
                      <Box
                        display='flex'
                        width='315px'
                        sx={{ justifyContent: 'center' }}
                      >
                        <Button
                          disabled={isSubmitting}
                          variant='outlined'
                          startIcon={<LoginRoundedIcon />}
                          sx={{ width: '100%' }}
                          onClick={async () => {
                            setSubmitting(true);
                            await handleEnterEvent({
                              user: user,
                              orgEvent: thisEvent,
                              activeOrgEvent: activeOrgEvent,
                              userParticipants: userParticipants,
                            });
                            await initializeUserParticipants();
                            navigate('/dashboard/event');
                            setSubmitting(false);
                          }}
                        >
                          Enter Event
                        </Button>
                      </Box>
                    ) : null}
                  </Grid>
                )}
                <Grid item>
                  <EventTimeRemainingChart
                    orgEvent={thisEvent}
                    sx={{
                      height: '260px',
                      maxWidth: '315px',
                      width: '315px',
                    }}
                  />
                </Grid>
                <Grid item>
                  <Paper
                    sx={{
                      padding: '5px',
                      maxWidth: '315px',
                      width: '315px',
                    }}
                  >
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <StyledStaticDateRangePicker
                        disabled
                        disableHighlightToday={false}
                        readOnly
                        displayStaticWrapperAs='desktop'
                        calendars={1}
                        value={[
                          new Date(thisEvent.ts_event_start),
                          new Date(thisEvent.ts_event_end),
                        ]}
                        onChange={() => {}}
                        sx={{
                          minHeight: '220px',
                        }}
                      />
                      {!thisEvent.event_time_elapsed ? (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                          }}
                        >
                          <AddToCalendarButton
                            name={thisEvent.event_details?.event_name}
                            uid={thisEvent.event_uuid}
                            description={descriptionPlainText(
                              thisEvent.event_details?.event_description,
                            )}
                            startDate={dtmFormatted(
                              thisEvent.ts_event_start,
                              'YYYY-MM-DD',
                            )}
                            startTime={dtmFormatted(
                              thisEvent.ts_event_start,
                              'HH:mm',
                            )}
                            endDate={dtmFormatted(
                              thisEvent.ts_event_end,
                              'YYYY-MM-DD',
                            )}
                            endTime={dtmFormatted(
                              thisEvent.ts_event_end,
                              'HH:mm',
                            )}
                            location={
                              window.location.protocol +
                              '://' +
                              window.location.hostname +
                              '/dashboard/event/' +
                              thisEvent.event_uuid
                            }
                            lightMode='dark'
                            options={[
                              'Apple',
                              'Google',
                              'iCal',
                              'MicrosoftTeams',
                              'Microsoft365',
                              'Outlook.com',
                            ]}
                          />
                        </Box>
                      ) : null}
                    </LocalizationProvider>
                  </Paper>
                </Grid>
                <Grid item>
                  <StackCashButton color='primary' disabled>
                    <AccountBalanceIcon
                      color='textPrimary'
                      sx={{
                        mr: 1,
                      }}
                    />
                    Event StackCash: {eventCoinBalance}
                  </StackCashButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
};

export default EventOverview;
