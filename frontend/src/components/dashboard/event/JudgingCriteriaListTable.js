import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import GetJudgingCriteria from 'src/components/stackref/GetJudgingCriteria';

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

const JudgingCriteriaListTable = (props) => {
  const { orgEvent, ...other } = props;
  const { user } = useAuth();
  const theme = useTheme();
  const [judgingCriteria, setJudgingCriteria] = useState();
  const [isLoading, setLoading] = useState(true);

  const getEventJudgingCriteria = useCallback(async () => {
    console.log(':: getEventJudgingCriteria');
    if (orgEvent) {
      try {
        await GetJudgingCriteria(user, orgEvent.event_uuid)
          .then((data) => {
            try {
              setJudgingCriteria(data);
              setLoading(false);
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((error) => {
            throw error;
          });
      } catch (err) {
        console.log(`>> getEventJudgingCriteria: ${err}`);
        setLoading(false);
      }
    }
  }, [orgEvent, user]);

  useEffect(() => {
    getEventJudgingCriteria();
  }, [getEventJudgingCriteria]);

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
        {isLoading ? (
          <Skeleton height={25} width='100%' />
        ) : judgingCriteria && judgingCriteria.length === 0 ? (
          <Typography>No judging criteria has been set</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableBody>
                {judgingCriteria.map((criterion, index) => {
                  const CriterionCategoryIcon =
                    categoryIcons[criterion.judging_criterion_category_icon] ||
                    BusinessCenterRoundedIcon;
                  return (
                    <TableRow
                      key={
                        criterion.judging_criterion_category_name + '_' + index
                      }
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <CriterionCategoryIcon
                            fontSize='small'
                            sx={{
                              mr: 1,
                            }}
                          />
                          {criterion.criterion_details?.criterion_name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {criterion.criterion_details?.criterion_summary}
                      </TableCell>
                      <TableCell>
                        {criterion.criterion_details?.criterion_description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

/*
EventsListGrid.propTypes = {
  orgEvents: PropTypes.array.isRequired
};
*/

export default JudgingCriteriaListTable;
