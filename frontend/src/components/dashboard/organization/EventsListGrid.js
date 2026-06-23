import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Link,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import PulsingBadge from 'src/icons/PulsingBadge';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetJudgingCriteria from 'src/components/stackref/GetJudgingCriteria';
import { dtmFormatted } from 'src/utils/dtmFormatting';
import EventBanner from 'src/components/dashboard/event/EventBanner';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  handleEnterEvent,
  handleExitEvent,
  handleRequestToJoin,
} from './eventEnterExitJoin';

// category icons
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CoPresentRoundedIcon from '@mui/icons-material/CoPresentRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';

const categoryIcons = {
  other: BusinessCenterRoundedIcon,
  performance: InsertChartRoundedIcon,
  cost: AttachMoneyRoundedIcon,
  feasibility: QuestionMarkRoundedIcon,
  teamwork: GroupsRoundedIcon,
  presentation: CoPresentRoundedIcon,
  innovation: LightbulbRoundedIcon,
};

const EventsListGrid = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const {
    activeOrgEvent,
    initializeUserParticipants,
    orgEvents,
    userParticipants,
  } = useStackRef();
  const theme = useTheme();
  const [judgingCriteria, setJudgingCriteria] = useState();
  const [isSubmitting, setSubmitting] = useState(false);

  const EventsGrid = styled(Grid)(({ theme }) => ({
    position: 'relative',
  }));

  const EventCard = styled(Card)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
  }));

  const ActiveIcon = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: theme.spacing(-0.5),
    top: theme.spacing(2.5),
  }));

  const NotPermittedIcon = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: theme.spacing(-0.5),
    top: theme.spacing(2.5),
  }));

  const getOrgJudgingCriteria = useCallback(async () => {
    console.log(':: getOrgJudgingCriteria');
    try {
      await GetJudgingCriteria(user)
        .then((data) => {
          try {
            setJudgingCriteria(data);
          } catch (err) {
            throw new Error(err);
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (err) {
      console.log(`>> getOrgJudgingCriteria: ${err}`);
    }
  }, [user]);

  useEffect(() => {
    getOrgJudgingCriteria();
  }, [getOrgJudgingCriteria]);

  return (
    <Box sx={{ width: '100%' }} {...other}>
      {!orgEvents ||
      orgEvents.filter(
        (orgEvent) =>
          orgEvent.event_status_name === 'Running' ||
          orgEvent.event_status_name === 'Judging',
      ).length === 0 ? (
        <Box>
          <Typography sx={{ color: 'text.secondary' }}>
            No active events running
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {orgEvents?.map((row, index) => {
            const eventDetails = row.event_details;

            return (
              (row.event_status_name === 'Running' ||
                row.event_status_name === 'Judging') && (
                <EventsGrid
                  item
                  key={row.event_uuid}
                  lg={4}
                  md={6}
                  xl={3}
                  xs={12}
                >
                  <EventCard
                    sx={{
                      ...(row.event_uuid === activeOrgEvent?.event_uuid && {
                        backgroundImage: 'none',
                      }),
                    }}
                  >
                    <CardHeader
                      title={
                        <EventBanner
                          eventUuid={row.event_uuid}
                          assetUuid={row.banner_image_uuid}
                          height='200px'
                          width='100%'
                          sx={{
                            maxHeight: '200px',
                            overflow: 'hidden',
                          }}
                        />
                      }
                    />
                    <CardContent>
                      <>
                        {!userParticipants ||
                          Object.keys(userParticipants).length === 0 ||
                          (userParticipants.findIndex(
                            (participant) =>
                              participant.event_uuid === row.event_uuid &&
                              participant.participant_roles?.length > 0,
                          ) === -1 && (
                            <Tooltip title='Not Permitted'>
                              <NotPermittedIcon>
                                <DoNotDisturbIcon color='error' />
                              </NotPermittedIcon>
                            </Tooltip>
                          ))}
                        {row.event_uuid === activeOrgEvent?.event_uuid ? (
                          <Tooltip title='Active Event'>
                            <ActiveIcon>
                              <CheckCircleRoundedIcon color='success' />
                            </ActiveIcon>
                          </Tooltip>
                        ) : null}
                        {eventDetails && (
                          <>
                            <Box
                              alignItems='center'
                              display='flex'
                              justifyContent='center'
                              mx='auto'
                            >
                              <Typography
                                variant='h6'
                                sx={{
                                  pb: 2,
                                  textAlign: 'center',
                                }}
                              >
                                {eventDetails.event_name}
                              </Typography>
                            </Box>
                            <Grid
                              container
                              spacing={0}
                              sx={{
                                pb: 1,
                              }}
                            >
                              <Grid item xs={2}>
                                <Tooltip title='Event Summary'>
                                  <InfoIcon />
                                </Tooltip>
                              </Grid>
                              <Grid item xs={10}>
                                <Typography variant='caption'>
                                  {eventDetails.event_summary}
                                </Typography>
                              </Grid>
                            </Grid>
                            <Grid
                              container
                              spacing={0}
                              sx={{
                                pb: 2,
                              }}
                            >
                              <Grid item xs={2}>
                                <Tooltip title='Date/Time'>
                                  <AccessTimeIcon />
                                </Tooltip>
                              </Grid>
                              <Grid item xs={10}>
                                <Typography variant='caption'>
                                  Event Start:{' '}
                                  {dtmFormatted(row.ts_event_start)}
                                </Typography>
                                <br />
                                <Typography variant='caption'>
                                  Event End: {dtmFormatted(row.ts_event_end)}
                                </Typography>
                              </Grid>
                            </Grid>
                            <Grid container>
                              <Grid item xs={2}>
                                <Tooltip title='Judging Criteria'>
                                  <GavelIcon />
                                </Tooltip>
                              </Grid>
                              <Grid item>
                                {judgingCriteria &&
                                judgingCriteria.length ===
                                  0 ? null : judgingCriteria ? (
                                  judgingCriteria
                                    .filter(
                                      (criterion) =>
                                        criterion.event_uuid === row.event_uuid,
                                    )
                                    .map((criterion, index) => {
                                      const CriterionCategoryIcon =
                                        categoryIcons[
                                          criterion
                                            .judging_criterion_category_icon
                                        ] || BusinessCenterRoundedIcon;
                                      return (
                                        <Tooltip
                                          title={
                                            criterion.judging_criterion_category_name
                                          }
                                          key={
                                            criterion.judging_criterion_category_name +
                                            '_' +
                                            index
                                          }
                                        >
                                          <CriterionCategoryIcon
                                            fontSize='small'
                                            sx={{
                                              mx: 0.5,
                                            }}
                                          />
                                        </Tooltip>
                                      );
                                    })
                                ) : (
                                  <Skeleton height={25} width={80} />
                                )}
                              </Grid>
                            </Grid>
                            <Grid
                              container
                              spacing={0}
                              direction='column'
                              alignItems='center'
                              justifyContent='center'
                              sx={{
                                mt: 1,
                              }}
                            >
                              {row.event_status_name && (
                                <PulsingBadge
                                  variant={row.event_status_name}
                                  withBorder
                                  pulsing={
                                    row.event_status_name === 'Running' ||
                                    row.event_status_name === 'Judging'
                                      ? true
                                      : false
                                  }
                                  badgeLabel={row.event_status_name}
                                />
                              )}
                            </Grid>
                          </>
                        )}
                        <CardActions
                          className='event-button'
                          sx={{
                            justifyContent: 'right',
                            p: 0,
                          }}
                        >
                          <Tooltip title='View details'>
                            <Link
                              component={RouterLink}
                              to={'/dashboard/event/' + row.event_uuid}
                              sx={{ textDecoration: 'none' }}
                            >
                              <IconButton
                                size='small'
                                sx={{
                                  backgroundColor: theme.palette.primary.main,
                                  mr: 1,
                                }}
                              >
                                <VisibilityRoundedIcon size='small' />
                              </IconButton>
                            </Link>
                          </Tooltip>
                          {!userParticipants ||
                          Object.keys(userParticipants).length === 0 ||
                          userParticipants.findIndex(
                            (participant) =>
                              participant.event_uuid === row.event_uuid,
                          ) === -1 ? (
                            <Tooltip title='Request to join'>
                              <span>
                                <IconButton
                                  disabled={isSubmitting}
                                  onClick={async () => {
                                    setSubmitting(true);
                                    await handleRequestToJoin({
                                      user: user,
                                      orgEvent: row,
                                    });
                                    initializeUserParticipants();
                                    setSubmitting(false);
                                  }}
                                  size='small'
                                  sx={{
                                    backgroundColor: theme.palette.primary.main,
                                  }}
                                >
                                  <PersonAddAltRoundedIcon size='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : userParticipants.findIndex(
                              (participant) =>
                                participant.event_uuid === row.event_uuid &&
                                participant.participant_roles,
                            ) === -1 ? (
                            <Tooltip title='Request submitted'>
                              <IconButton
                                size='small'
                                sx={{
                                  backgroundColor: theme.palette.primary.main,
                                }}
                              >
                                <CheckCircleRoundedIcon size='small' />
                              </IconButton>
                            </Tooltip>
                          ) : row.event_uuid === activeOrgEvent?.event_uuid ? (
                            <Tooltip title='Exit event'>
                              <span>
                                <IconButton
                                  disabled={isSubmitting}
                                  onClick={async () => {
                                    setSubmitting(true);
                                    await handleExitEvent({
                                      user: user,
                                      orgEvent: row,
                                      userParticipants: userParticipants,
                                    });
                                    await initializeUserParticipants();
                                    setSubmitting(false);
                                  }}
                                  size='small'
                                  sx={{
                                    backgroundColor: theme.palette.primary.main,
                                  }}
                                >
                                  <LogoutRoundedIcon size='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : !activeOrgEvent ||
                            row.event_uuid !== activeOrgEvent.event_uuid ? (
                            <Tooltip title='Enter event'>
                              <span>
                                <IconButton
                                  disabled={isSubmitting}
                                  onClick={async () => {
                                    setSubmitting(true);
                                    await handleEnterEvent({
                                      user: user,
                                      orgEvent: row,
                                      activeOrgEvent: activeOrgEvent,
                                      userParticipants: userParticipants,
                                    });
                                    await initializeUserParticipants();
                                    setSubmitting(false);
                                  }}
                                  size='small'
                                  sx={{
                                    backgroundColor: theme.palette.primary.main,
                                  }}
                                >
                                  <LoginRoundedIcon size='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}
                        </CardActions>
                      </>
                    </CardContent>
                  </EventCard>
                </EventsGrid>
              )
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

/*
EventsListGrid.propTypes = {
  orgEvents: PropTypes.array.isRequired
};
*/

export default EventsListGrid;
