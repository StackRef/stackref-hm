import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { useTheme } from '@mui/material/styles';
import {
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
  Typography,
} from '@mui/material';
import { useSelector } from 'src/store';
import SentimentDissatisfiedRoundedIcon from '@mui/icons-material/SentimentDissatisfiedRounded';

// category icons
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CoPresentRoundedIcon from '@mui/icons-material/CoPresentRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';

const categoryIcons = {
  Other: BusinessCenterRoundedIcon,
  Performance: InsertChartRoundedIcon,
  Cost: AttachMoneyRoundedIcon,
  Feasibility: QuestionMarkRoundedIcon,
  Teamwork: GroupsRoundedIcon,
  Presentation: CoPresentRoundedIcon,
  Innovation: LightbulbRoundedIcon,
};

const headCells = [
  {
    id: 'judging_criterion_name',
    label: 'Criterion',
  },
  {
    id: 'judging_criterion_summary',
    label: 'Summary',
  },
  {
    id: 'score_value',
    label: 'Score',
  },
];

function EnhancedTableHead(props) {
  const theme = useTheme();

  return (
    <TableHead>
      <TableRow
        sx={{
          backgroundColor: theme.palette.background.tableHead,
        }}
      >
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align='left'>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const TeamScoresListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const theme = useTheme();
  const teamScoreItems = useSelector((state) => state.teamScoreItems);

  return (
    <Card {...other}>
      <CardHeader
        title='Judge Scores'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby='tableTitle'
            size='small'
          >
            <EnhancedTableHead />
            <TableBody>
              {teamScoreItems.data?.team_score_items ? (
                teamScoreItems.data.team_score_items.map(
                  (teamScoreItem, index) => {
                    const CriterionCategoryIcon =
                      categoryIcons[
                        teamScoreItem?.judging_criterion_category_name
                      ] || BusinessCenterRoundedIcon;
                    return (
                      <TableRow
                        key={teamScoreItem?.team_score_item_uuid}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell component='th' scope='row'>
                          <Grid container spacing={1}>
                            <Grid item>
                              <CriterionCategoryIcon fontSize='small' />
                            </Grid>
                            <Grid item>
                              <Typography variant='body1'>
                                {teamScoreItem?.judging_criterion_details
                                  ?.criterion_name || 'Undefined'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </TableCell>
                        <TableCell align='left'>
                          <Typography>
                            {
                              teamScoreItem?.judging_criterion_details
                                ?.criterion_summary
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body1'>
                            {teamScoreItem?.team_score_item_value}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )
              ) : (
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography sx={{ fontStyle: 'italic' }}>
                      No scores received yet{' '}
                      <SentimentDissatisfiedRoundedIcon fontSize='small' />
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TeamScoresListTable;
