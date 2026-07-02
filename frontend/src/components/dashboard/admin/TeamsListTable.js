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
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
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
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import { visuallyHidden } from '@mui/utils';
import TeamEdit from './TeamEdit';
import { useConfirm } from 'material-ui-confirm';
import { useDispatch, useSelector } from 'src/store';
import { getTeams } from 'src/slices/teams';

const applyFilters = (eventTeams, query, filters) =>
  eventTeams.filter((team) => {
    let matches = true;

    const teamName = team.team_name;

    if (
      query &&
      !teamName.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });

const applyPagination = (eventTeams, page, limit) =>
  eventTeams.slice(page * limit, page * limit + limit);

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
    id: 'team_name',
    numeric: false,
    disablePadding: true,
    label: 'Team Name',
    sortable: true,
  },
  {
    id: 'team_member_count',
    numeric: false,
    disablePadding: false,
    label: '# Members',
    sortable: true,
  },
  {
    id: 'actions',
    numeric: false,
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

  const createSortHandler = (property) => (team) => {
    onRequestSort(team, property);
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
                'aria-label': 'select all teams',
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
        ''
      )}
      {selected.length > 0 ? (
        <Tooltip title='Delete'>
          <span>
            <IconButton
              disabled={isSubmitting || disabled}
              onClick={async () => {
                confirm({
                  title: 'Delete teams?',
                  content: `This will delete ${selected.length} selected teams`,
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
                      selected?.forEach(async (teamUuid) => {
                        try {
                          let payload = {};
                          if (isMountedRef.current) {
                            setSubmitting(true);
                            payload['user'] = user;
                            payload['action'] = 'archive';
                            payload['team_uuid'] = teamUuid;

                            await TeamEdit(payload, (response) => {
                              if (!response || response.status_code !== 200)
                                throw new Error('Team delete failed');
                            })
                              .then(() => {
                                dispatch(
                                  getTeams({
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
                      console.error(`>> TeamsListTable: ${error}`);
                      setSubmitting(false);
                      toast.error('Teams delete failed', {
                        containerId: 'results',
                      });
                    }
                  })
                  .then(async () => {
                    setSubmitting(false);
                    setSelected([]);
                    toast.success('Teams deleted', { containerId: 'results' });
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

const TeamsListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('team_name');
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    eventName: null,
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [teamsStatus, setTeamsStatus] = useState();
  const dispatch = useDispatch();
  const orgEvent = useSelector((state) => state.orgEvent);
  const teams = useSelector((state) => state.teams);

  useEffect(() => {
    !teams.data.length
      ? setTeamsStatus('No teams assigned')
      : setTeamsStatus(null);
  }, [teams]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllTeams = (event) => {
    setSelected(
      event.target.checked ? teams.data.map((team) => team.team_uuid) : [],
    );
  };

  const handleSelectOneTeam = (event, teamUuid) => {
    if (!selected.includes(teamUuid)) {
      setSelected((prevSelected) => [...prevSelected, teamUuid]);
    } else {
      setSelected((prevSelected) =>
        prevSelected.filter((uuid) => uuid !== teamUuid),
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
      teamStatus: value,
    }));
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    teams.data && page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - teams.data.length)
      : 0;

  //const filteredEvents = applyFilters(orgEvents, query, filters);

  return (
    <Card>
      <CardHeader
        title='Event Teams'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
        subheader={
          teamsStatus ? <Chip color='error' label={teamsStatus} /> : null
        }
      />
      <CardContent>
        <EnhancedTableToolbar
          selected={selected}
          setSelected={setSelected}
          setSubmitting={setSubmitting}
          disabled={
            isSubmitting ||
            ['Judging', 'Complete', 'Archived'].includes(
              orgEvent.data.event_status_name,
            )
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
              onSelectAllClick={handleSelectAllTeams}
              onRequestSort={handleRequestSort}
              rowCount={teams.data ? teams.data.length : 1}
              disabled={
                isSubmitting ||
                ['Judging', 'Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
            />
            <TableBody>
              {teams.data
                .slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.team_uuid);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  const teamDetails = row.team_details;

                  return (
                    <TableRow
                      hover
                      onClick={(event) =>
                        !isSubmitting &&
                        !['Judging', 'Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        ) &&
                        handleSelectOneTeam(event, row.team_uuid)
                      }
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.team_uuid}
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
                              ['Judging', 'Complete', 'Archived'].includes(
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
                        {teamDetails.team_name || ''}
                      </TableCell>
                      <TableCell align='left'>
                        {row.team_members?.length || 0}
                      </TableCell>
                      <TableCell align='right'>
                        {['Complete', 'Archived'].includes(
                          orgEvent.data.event_status_name,
                        ) ? null : selected.length > 1 ? (
                          <Box sx={{ py: 2.2, width: '72px' }} />
                        ) : (
                          <>
                            <Tooltip title='Edit'>
                              <IconButton
                                color='primary'
                                component={RouterLink}
                                to={`/dashboard/admin/events/${row.event_uuid}/teams/${row.team_uuid}`}
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
                                    [
                                      'Judging',
                                      'Complete',
                                      'Archived',
                                    ].includes(orgEvent.data.event_status_name)
                                  }
                                  onClick={async () => {
                                    try {
                                      const payload = {};
                                      if (isMountedRef.current) {
                                        setSubmitting(true);
                                        payload['user'] = user;
                                        payload['action'] = 'archive';
                                        payload['team_uuid'] = row.team_uuid;

                                        await TeamEdit(payload, (response) => {
                                          if (
                                            !response ||
                                            response.status_code !== 200
                                          )
                                            throw new Error(
                                              'Team delete failed',
                                            );
                                        })
                                          .then(() => {
                                            toast.success('Team deleted', {
                                              containerId: 'results',
                                            });
                                            dispatch(
                                              getTeams({
                                                user: user,
                                                eventUuid:
                                                  orgEvent.data.data.event_uuid,
                                              }),
                                            );
                                            setSubmitting(false);
                                          })
                                          .catch((err) => {
                                            toast.error(err.message, {
                                              containerId: 'results',
                                            });
                                          });
                                      }
                                    } catch (err) {
                                      console.error(
                                        `>> TeamsListTable: ${err}`,
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
          count={teams.data ? teams.data.length : 1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
};

/*
TeamsListTable.propTypes = {
  teams: PropTypes.array.isRequired
};
*/

export default TeamsListTable;
