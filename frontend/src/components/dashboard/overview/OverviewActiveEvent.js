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
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import PulsingBadge from 'src/icons/PulsingBadge';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetJudgingCriteria from 'src/components/stackref/GetJudgingCriteria';
import { dtmFormatted } from 'src/utils/dtmFormatting';
import EventBanner from 'src/components/dashboard/event/EventBanner';

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

console.log(':: OverviewActiveEvent');

const OverviewActiveEvent = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const theme = useTheme();
  const [judgingCriteria, setJudgingCriteria] = useState();
  const [isLoading, setLoading] = useState(true);
  const { initializeUserParticipants, activeOrgEvent } = useStackRef();

  console.log(':: OverviewActiveEvent');

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
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.log(`>> getJudgingCriteria: ${err}`);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    initializeUserParticipants();
    getOrgJudgingCriteria();
  }, [getOrgJudgingCriteria, initializeUserParticipants]);

  return (
    <Card>
      <CardHeader
        sx={{
          backgroundColor: theme.palette.primary.main,
          px: 2,
          py: 1,
        }}
        title={
          <Grid container>
            <Grid item>
              <Typography color={theme.palette.background.paper} variant='h6'>
                Current Active Event
              </Typography>
              {activeOrgEvent?.event_details?.event_name ? (
                <Typography variant='body2' color='textPrimary'>
                  {activeOrgEvent.event_details.event_name}
                </Typography>
              ) : null}
            </Grid>
            <Grid
              item
              sx={{
                ml: 2,
                mt: 0.5,
              }}
            >
              {activeOrgEvent?.event_status_name ? (
                <PulsingBadge
                  variant={activeOrgEvent.event_status_name}
                  withBorder
                  pulsing={
                    activeOrgEvent.event_status_name === 'Running' ||
                    activeOrgEvent.event_status_name === 'Judging'
                      ? true
                      : false
                  }
                  badgeLabel={activeOrgEvent.event_status_name}
                />
              ) : null}
            </Grid>
          </Grid>
        }
      />
      <CardContent>
        {isLoading ? (
          <Skeleton sx={{ width: '100%', height: '100px' }} />
        ) : activeOrgEvent?.event_details ? (
          <>
            <EventBanner
              eventUuid={activeOrgEvent.event_uuid}
              assetUuid={activeOrgEvent.banner_image_uuid}
              height='200px'
              width='100%'
              sx={{
                maxHeight: '200px',
                overflow: 'hidden',
              }}
            />
            <Grid
              container
              spacing={0}
              sx={{
                mt: 1,
                pb: 1,
              }}
            >
              <Grid item xs={2}>
                <Tooltip title='Event Summary'>
                  <InfoIcon />
                </Tooltip>
              </Grid>
              <Grid item xs={10}>
                <Typography variant='body2'>
                  {activeOrgEvent.event_details.event_summary}
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
                <Typography variant='body2'>
                  Event Start: {dtmFormatted(activeOrgEvent.ts_event_start)}
                </Typography>
                <Typography variant='body2'>
                  Event End: {dtmFormatted(activeOrgEvent.ts_event_end)}
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
                {judgingCriteria
                  ?.filter(
                    (criterion) =>
                      criterion.event_uuid === activeOrgEvent.event_uuid,
                  )
                  .map((criterion, index) => {
                    const CriterionCategoryIcon =
                      categoryIcons[
                        criterion.judging_criterion_category_icon
                      ] || BusinessCenterRoundedIcon;
                    return (
                      <Tooltip
                        title={criterion.judging_criterion_category_name}
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
                  })}
              </Grid>
            </Grid>
          </>
        ) : (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            <Typography sx={{ color: 'text.secondary' }}>
              Not in a current active event
            </Typography>
          </Box>
        )}
        <CardActions
          className='event-button'
          sx={{
            justifyContent: 'right',
            p: 0,
          }}
        ></CardActions>
      </CardContent>
    </Card>
  );
};

/*
EventsListGrid.propTypes = {
  orgEvents: PropTypes.array.isRequired
};
*/

export default OverviewActiveEvent;
