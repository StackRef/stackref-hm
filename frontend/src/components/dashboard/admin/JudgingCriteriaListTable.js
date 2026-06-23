import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'use-is-mounted-ref';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { visuallyHidden } from '@mui/utils';
import { JudgingCriterionEdit } from './JudgingCriterionEdit';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import { useConfirm } from 'material-ui-confirm';
import { useDispatch, useSelector } from 'src/store';
import { getJudgingCriteria } from 'src/slices/judgingCriteria';

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

const applyFilters = (judgingCriteria, query, filters) =>
  judgingCriteria.filter((judgingCriterion) => {
    let matches = true;

    const criterionName = judgingCriterion.event_name;

    if (
      query &&
      !criterionName.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });

const applyPagination = (judgingCriteria, page, limit) =>
  judgingCriteria.slice(page * limit, page * limit + limit);

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

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
    id: 'criterion_weight',
    numeric: false,
    disablePadding: false,
    label: 'Weight',
    sortable: true,
  },
  {
    id: 'actions',
    numeric: true,
    disablePadding: false,
    label: '',
    sortable: false,
  },
];

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    disabled,
  } = props;
  const theme = useTheme();
  const orgEvent = useSelector((state) => state.orgEvent);

  const createSortHandler = (property) => (judgingCriterion) => {
    onRequestSort(judgingCriterion, property);
  };

  return (
    <TableHead>
      <TableRow
        sx={{
          backgroundColor: theme.palette.background.tableHead,
        }}
      >
        <TableCell padding='checkbox'>
          {['Complete', 'Archived'].includes(
            orgEvent.data.event_status_name,
          ) ? null : (
            <Checkbox
              color='primary'
              disabled={disabled}
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{
                'aria-label': 'select all criteria',
              }}
            />
          )}
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component='span' sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

/*
EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired
};
*/

const EnhancedTableToolbar = (props) => {
  const { selected, setSelected, isSubmitting, setSubmitting, disabled } =
    props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const confirm = useConfirm();
  const theme = useTheme();
  const orgEvent = useSelector((state) => state.orgEvent);

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(selected.length > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
      variant='dense'
    >
      {selected.length > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color='inherit'
          variant='subtitle1'
          component='div'
        >
          {selected.length} selected
        </Typography>
      ) : (
        <></>
      )}
      {selected.length > 0 ? (
        <Tooltip title='Delete'>
          <span>
            <IconButton
              disabled={isSubmitting || disabled}
              onClick={async () => {
                confirm({
                  title: 'Delete judging criteria?',
                  content: `This will delete ${selected.length} selected judging criteria`,
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
                  .then(() => {
                    try {
                      selected?.forEach(async (judgingCriterionUuid) => {
                        try {
                          let payload = {};
                          if (isMountedRef.current) {
                            setSubmitting(true);
                            payload['user'] = user;
                            payload['action'] = 'archive';
                            payload['judging_criterion_uuid'] =
                              judgingCriterionUuid;

                            await JudgingCriterionEdit(payload, (response) => {
                              if (!response || response.status_code !== 200)
                                throw new Error('Criterion delete failed');
                            })
                              .then(() => {
                                dispatch(
                                  getJudgingCriteria({
                                    user: user,
                                    eventUuid: orgEvent.data.event_uuid,
                                  }),
                                );
                              })
                              .catch((error) => {
                                throw error;
                              });
                          }
                        } catch (error) {
                          throw error;
                        }
                      });
                    } catch (error) {
                      console.error(`>> JudgingCriteriaListTable: ${error}`);
                      setSubmitting(false);
                      toast.error('Criteria delete failed', {
                        containerId: 'results',
                      });
                    }
                  })
                  .then(async () => {
                    setSubmitting(false);
                    setSelected([]);
                    toast.success('Criteria deleted', {
                      containerId: 'results',
                    });
                  })
                  .catch(() => {});
              }}
            >
              <DeleteOutlinedIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <></>
        /* TODO
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        */
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string),
};

const JudgingCriteriaListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    criterionName: null,
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [judgingCriteriaStatus, setJudgingCriteriaStatus] = useState();
  const [eventJudgingCriteria, setEventJudgingCriteria] = useState();
  const dispatch = useDispatch();
  const orgEvent = useSelector((state) => state.orgEvent);
  const judgingCriteria = useSelector((state) => state.judgingCriteria);

  useEffect(() => {
    !judgingCriteria.data.length
      ? setJudgingCriteriaStatus('No judging criteria set')
      : setJudgingCriteriaStatus(null);
  }, [judgingCriteria]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllCriteria = (event) => {
    setSelected(
      event.target.checked
        ? judgingCriteria.data.map((jc) => jc.judging_criterion_uuid)
        : [],
    );
  };

  const handleSelectOneCriterion = (event, judgingCriterionUuid) => {
    if (!selected.includes(judgingCriterionUuid)) {
      setSelected((prevSelected) => [...prevSelected, judgingCriterionUuid]);
    } else {
      setSelected((prevSelected) =>
        prevSelected.filter((uuid) => uuid !== judgingCriterionUuid),
      );
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleEventStatusChange = (event) => {
    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      eventStatus: value,
    }));
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - judgingCriteria.data.length)
      : 0;

  //const filteredEvents = applyFilters(judgingCriteria, query, filters);

  return (
    <Card>
      <CardHeader
        title='Event Judging Criteria'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
        subheader={
          judgingCriteriaStatus ? (
            <Chip color='error' label={judgingCriteriaStatus} />
          ) : null
        }
      />
      <CardContent>
        <EnhancedTableToolbar
          selected={selected}
          setSelected={setSelected}
          isSubmitting={isSubmitting}
          setSubmitting={setSubmitting}
          disabled={
            isSubmitting ||
            ['Complete', 'Archived'].includes(orgEvent.data.event_status_name)
          }
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby='tableTitle'
            size={'small'}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllCriteria}
              onRequestSort={handleRequestSort}
              rowCount={judgingCriteria.data ? judgingCriteria.data.length : 1}
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
            />
            <TableBody>
              {judgingCriteria.data
                .slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.judging_criterion_uuid);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  const criterionDetails = row.criterion_details;
                  const criterionName = criterionDetails.criterion_name || '';
                  const criterionSummary =
                    criterionDetails.criterion_summary || '';
                  const criterionCategory =
                    row.judging_criterion_category_name || '';
                  const criterionWeight = row.criterion_weight || 0;
                  const CriterionCategoryIcon =
                    categoryIcons[row.judging_criterion_category_icon] ||
                    BusinessCenterRoundedIcon;

                  return (
                    <TableRow
                      hover
                      onClick={(event) =>
                        !isSubmitting &&
                        !['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        ) &&
                        handleSelectOneCriterion(
                          event,
                          row.judging_criterion_uuid,
                        )
                      }
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.judging_criterion_uuid}
                      selected={isItemSelected}
                    >
                      <TableCell padding='checkbox'>
                        {['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        ) ? null : (
                          <Checkbox
                            color='primary'
                            checked={isItemSelected}
                            disabled={
                              isSubmitting ||
                              ['Complete', 'Archived'].includes(
                                orgEvent.data.event_status_name,
                              )
                            }
                            inputProps={{
                              'aria-labelledby': labelId,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell
                        component='th'
                        id={labelId}
                        scope='row'
                        padding='none'
                      >
                        <Typography variant='body1'>{criterionName}</Typography>
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
                      <TableCell align='left'>{criterionWeight}</TableCell>
                      <TableCell align='right'>
                        {['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        ) ? null : row.criterion_status !== 'Archived' &&
                          selected.length > 1 ? (
                          <Box sx={{ py: 2.2, width: '72px' }} />
                        ) : (
                          <>
                            <Tooltip title='Edit'>
                              <IconButton
                                color='primary'
                                component={RouterLink}
                                disabled={
                                  isSubmitting ||
                                  ['Complete', 'Archived'].includes(
                                    orgEvent.data.event_status_name,
                                  )
                                }
                                to={`/dashboard/admin/events/${row.event_uuid}/judging_criterion/${row.judging_criterion_uuid}`}
                              >
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Delete'>
                              <span>
                                <IconButton
                                  color='primary'
                                  disabled={
                                    isSubmitting ||
                                    ['Complete', 'Archived'].includes(
                                      orgEvent.data.event_status_name,
                                    )
                                  }
                                  onClick={async () => {
                                    try {
                                      const payload = {};
                                      if (isMountedRef.current) {
                                        setSubmitting(true);
                                        payload['user'] = user;
                                        payload['action'] = 'archive';
                                        payload['event_uuid'] = row.event_uuid;
                                        payload['judging_criterion_uuid'] =
                                          row.judging_criterion_uuid;

                                        await JudgingCriterionEdit(
                                          payload,
                                          (response) => {
                                            if (
                                              !response ||
                                              response.status_code !== 200
                                            )
                                              throw new Error(
                                                'Criterion delete failed',
                                              );
                                          },
                                        )
                                          .then(() => {
                                            toast.success('Criterion deleted', {
                                              containerId: 'results',
                                            });
                                            dispatch(
                                              getJudgingCriteria({
                                                user: user,
                                                eventUuid:
                                                  orgEvent.data.event_uuid,
                                              }),
                                            );
                                            setSelected([]);
                                            setSubmitting(false);
                                          })
                                          .catch((error) => {
                                            toast.error(error.message, {
                                              containerId: 'results',
                                            });
                                          });
                                      }
                                    } catch (error) {
                                      console.error(
                                        `>> JudgingCriteriaListTable: ${error}`,
                                      );
                                      setSubmitting(false);
                                    }
                                  }}
                                >
                                  <DeleteOutlinedIcon fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 33 * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={judgingCriteria.data ? judgingCriteria.data.length : 1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
};

export default JudgingCriteriaListTable;
