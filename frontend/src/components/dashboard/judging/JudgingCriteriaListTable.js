import { useEffect, useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Rating,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import useStackRef from 'src/hooks/useStackRef';
import { useDispatch, useSelector } from 'src/store';
import {
  getTeamScoreItems,
  postTeamScoreItems,
} from 'src/slices/teamScoreItems';

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

const headCells = [
  {
    id: 'criterion_name',
    numeric: false,
    disablePadding: true,
    label: 'Name',
    sortable: true,
  },
  {
    id: 'criterion_category',
    numeric: false,
    disablePadding: false,
    label: 'Category',
    sortable: true,
  },
  {
    id: 'criterion_value',
    numeric: false,
    disablePadding: false,
    label: 'Your Score',
    sortable: true,
  },
];

function EnhancedTableHead(props) {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align='left'>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const JudgingCriteriaListTable = (props) => {
  const { team, judge, ...other } = props;
  const theme = useTheme();
  const { user } = useAuth();
  const { activeOrgEvent, initializeJudgingCriteria, judgingCriteria } =
    useStackRef();
  const [scoreValues, setScoreValues] = useState([]);
  const [updatingScoreItem, setUpdatingScoreItem] = useState({});
  const [isSubmitting, setSubmitting] = useState(false);
  const teamScoreItems = useSelector((state) => state.teamScoreItems);
  const dispatch = useDispatch();

  useEffect(() => {
    async function initialize() {
      await initializeJudgingCriteria(activeOrgEvent?.event_uuid);
      dispatch(getTeamScoreItems({ user: user, teamUuid: team?.team_uuid }));
    }
    initialize();
  }, [activeOrgEvent, dispatch, initializeJudgingCriteria, team, user]);

  const handleScoreItemSliderChange = async (event) => {
    setUpdatingScoreItem({
      judgingCriterionUuid: event.target.name,
      teamScoreItemValue: event.target.value,
    });

    // Team has some scoreValues, so update the one we changed
    if (scoreValues) {
      if (
        scoreValues?.find(
          (s) =>
            s.judgingCriterionUuid === updatingScoreItem.judgingCriterionUuid &&
            s.judgeUuid === judge?.participant_uuid,
        )
      ) {
        setScoreValues(
          scoreValues.map((item) => {
            if (item.judgingCriterionUuid === event.target.name) {
              return { ...item, scoreItemValue: event.target.value };
            }
            return item;
          }),
        );
      } else {
        setScoreValues([
          ...scoreValues,
          {
            judgeUuid: judge?.participant_uuid,
            judgingCriterionUuid: event.target.name,
            scoreItemValue: event.target.value,
          },
        ]);
      }
      // Team has no scoreValues at all, so initialize it with this one
    } else {
      setScoreValues([
        {
          judgeUuid: judge?.participant_uuid,
          judgingCriterionUuid: event.target.name,
          scoreItemValue: event.target.value,
        },
      ]);
    }
  };

  const commitRatingChange = async (event) => {
    setSubmitting(true);
    const payload = {};
    payload['user'] = user;
    payload['action'] = 'update';
    payload['team_uuid'] = team?.team_uuid;
    payload['judge_uuid'] = judge?.participant_uuid;
    payload['judging_criterion_uuid'] = event.target.name;
    payload['team_score_item_value'] = event.target.defaultValue;

    await dispatch(postTeamScoreItems(payload))
      .then((data) =>
        dispatch(getTeamScoreItems({ user: user, teamUuid: team?.team_uuid })),
      )
      .catch((error) => {
        setSubmitting(false);
        throw new Error(error);
      });
    setSubmitting(false);
  };

  useEffect(() => {
    async function initialize() {
      setScoreValues(
        teamScoreItems?.data?.team_score_items?.map((teamScoreItem) => {
          return {
            judgeUuid: teamScoreItem.judge_uuid,
            judgingCriterionUuid: teamScoreItem.judging_criterion_uuid,
            scoreItemValue: teamScoreItem.team_score_item_value,
          };
        }),
      );
    }
    initialize();
  }, [teamScoreItems, user]);

  useEffect(() => {
    if (teamScoreItems.postSuccess) {
      toast.success(teamScoreItems.postSuccess, { containerId: 'results' });
    } else if (teamScoreItems.postError) {
      toast.error(teamScoreItems.postError || teamScoreItems.postSuccess, {
        containerId: 'results',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamScoreItems.postError, teamScoreItems.postSuccess]);

  return (
    <Card {...other}>
      <CardHeader
        title='Judging Criteria'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        {!teamScoreItems.isLoaded ? (
          <Box
            sx={{
              m: 2,
            }}
          >
            <Skeleton height={100} width={600} />
          </Box>
        ) : (
          <TableContainer>
            <Table
              sx={{ minWidth: 750 }}
              aria-labelledby='tableTitle'
              size='small'
            >
              <EnhancedTableHead />
              <TableBody>
                {judgingCriteria ? (
                  judgingCriteria?.map((row, index) => {
                    const criterionUuid = row.judging_criterion_uuid;
                    const criterionDetails = row.criterion_details;
                    const criterionName = criterionDetails.criterion_name || '';
                    const criterionSummary =
                      criterionDetails.criterion_summary || '';
                    const criterionCategory =
                      row.judging_criterion_category_name || '';
                    const criterionWeight = row.criterion_weight || 1;
                    const CriterionCategoryIcon =
                      categoryIcons[row.judging_criterion_category_icon] ||
                      BusinessCenterRoundedIcon;
                    let criterionScoreValue =
                      scoreValues?.find(
                        (s) =>
                          s.judgingCriterionUuid === criterionUuid &&
                          s.judgeUuid === judge?.participant_uuid,
                      )?.scoreItemValue || 0;

                    return (
                      <TableRow
                        key={row.judging_criterion_uuid}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell component='th' scope='row'>
                          <Typography variant='body1'>
                            {criterionName}
                          </Typography>
                          <Typography variant='body2'>
                            {criterionSummary}
                          </Typography>
                        </TableCell>
                        <TableCell align='left'>
                          <Grid container spacing={1}>
                            <Grid item>
                              <CriterionCategoryIcon size='small' />
                            </Grid>
                            <Grid item>
                              <Typography>{criterionCategory}</Typography>
                            </Grid>
                          </Grid>
                        </TableCell>
                        <TableCell align='left'>
                          <Grid
                            container
                            spacing={2}
                            sx={{
                              display: 'flex',
                            }}
                          >
                            <Grid item>
                              <Rating
                                disabled={
                                  activeOrgEvent?.event_status_name !==
                                    'Judging' || isSubmitting
                                    ? true
                                    : false
                                }
                                name={criterionUuid}
                                onChange={commitRatingChange}
                                max={10}
                                precision={0.5}
                                value={criterionScoreValue}
                              />
                            </Grid>
                            <Grid item>
                              <Typography>
                                {`${criterionScoreValue} of 10`}
                              </Typography>
                            </Grid>
                          </Grid>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {activeOrgEvent?.event_status_name !== 'Judging' && (
          <Typography variant='body2' sx={{ fontStyle: 'italic', mt: 2 }}>
            Scores can only be submitted when the event is in its judging phase.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default JudgingCriteriaListTable;
