import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { visuallyHidden } from '@mui/utils';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import { dtmFormatted } from 'src/utils/dtmFormatting';
import ParticipantCreate from 'src/components/dashboard/admin/ParticipantCreate';
import { toast } from 'react-toastify';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineOutlined';

const applyFilters = (orgEvents, query, filters) =>
  orgEvents.filter((orgEvent) => {
    let matches = true;

    const eventName = orgEvent.event_name;

    if (
      query &&
      !eventName.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });

const applyPagination = (orgEvents, page, limit) =>
  orgEvents.slice(page * limit, page * limit + limit);

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
    id: 'event_name',
    numeric: false,
    disablePadding: false,
    label: 'Event Name',
    sortable: true,
  },
  {
    id: 'event_status_name',
    numeric: false,
    disablePadding: false,
    label: 'Status',
    sortable: true,
  },
  {
    id: 'ts_event_start',
    numeric: false,
    disablePadding: false,
    label: 'Start',
    sortable: true,
  },
  {
    id: 'ts_event_end',
    numeric: false,
    disablePadding: false,
    label: 'End',
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
  const { order, orderBy, rowCount, onRequestSort } = props;
  const theme = useTheme();

  const createSortHandler = (property) => (orgEvent) => {
    onRequestSort(orgEvent, property);
  };

  return (
    <TableHead>
      <TableRow
        sx={{
          backgroundColor: theme.palette.background.tableHead,
        }}
      >
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

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const EnhancedTableToolbar = (props) => {
  const { numSelected } = props;
  return;

  /* TODO
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 }
      }}
    >
      <Tooltip title="Filter list">
        <IconButton>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
  */
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const EventsListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    eventName: null,
  });
  const { orgEvents, userParticipants } = useStackRef();
  const { user } = useAuth();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const nonRunningEvents = useMemo(
    () =>
      orgEvents?.filter(
        (orgEvent) =>
          orgEvent.event_status_name !== 'Running' &&
          orgEvent.event_status_name !== 'Judging',
      ),
    [orgEvents],
  );

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = nonRunningEvents.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
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
      ? Math.max(0, (1 + page) * rowsPerPage - nonRunningEvents.length)
      : 0;

  //const filteredEvents = applyFilters(orgEvents, query, filters);

  return (
    <Box sx={{ width: '100%' }}>
      <EnhancedTableToolbar numSelected={selected.length} />
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
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={nonRunningEvents ? nonRunningEvents.length : 1}
          />
          <TableBody>
            {nonRunningEvents
              ?.slice()
              .sort(getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isItemSelected = isSelected(row.event_uuid);
                const labelId = `enhanced-table-checkbox-${index}`;

                const eventDetails = row.event_details;
                const eventName = eventDetails.event_name || '';
                const eventSummary = eventDetails.event_summary || '';

                return (
                  <TableRow
                    hover
                    role='checkbox'
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.event_uuid}
                  >
                    <TableCell component='th' id={labelId} scope='row'>
                      <Typography variant='body1'>{eventName}</Typography>
                      <Typography color='textSecondary' variant='body2'>
                        {eventSummary}
                      </Typography>
                    </TableCell>
                    <TableCell align='left'>
                      <Chip
                        color={
                          row?.event_status_name === 'Running'
                            ? 'success'
                            : row?.event_status_name === 'Judging'
                              ? 'warning'
                              : row?.event_status_name === 'Complete'
                                ? 'secondary'
                                : 'primary'
                        }
                        label={row.event_status_name}
                      />
                    </TableCell>
                    <TableCell
                      align='left'
                      sx={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dtmFormatted(row.ts_event_start)}
                    </TableCell>
                    <TableCell
                      align='left'
                      sx={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dtmFormatted(row.ts_event_end)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        minWidth: 120,
                      }}
                    >
                      {row.event_status_name === 'Ready' &&
                      (Object.keys(userParticipants).length === 0 ||
                        userParticipants.findIndex(
                          (participant) =>
                            participant.event_uuid === row.event_uuid,
                        ) === -1) ? (
                        <Tooltip title='Request To Attend'>
                          <IconButton
                            disabled={isSubmitting}
                            onClick={async () => {
                              setSubmitting(true);
                              const payload = {
                                user: user,
                                action: 'request_attend',
                                user_uuid: user.user_uuid,
                                event_uuid: row.event_uuid,
                              };
                              try {
                                await ParticipantCreate(payload, (response) => {
                                  if (!response || response.status_code !== 200)
                                    throw new Error('Request failed');
                                })
                                  .then(() => {
                                    toast.success(
                                      `Sent request to join '${row.event_details.event_name}'`,
                                      { containerId: 'results' },
                                    );
                                    setSubmitting(false);
                                  })
                                  .catch((error) => {
                                    toast.error(error.message, {
                                      containerId: 'results',
                                    });
                                    throw error;
                                  });
                              } catch (error) {
                                console.error(`>> request_attend: ${error}`);
                                setSubmitting(false);
                              }
                            }}
                          >
                            <AddCircleIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      ) : userParticipants.some(
                          (participant) =>
                            participant.event_uuid === row.event_uuid &&
                            (!participant.participant_roles ||
                              participant.participant_roles.length === 0),
                        ) ? (
                        <Tooltip title='Request sent'>
                          <IconButton>
                            <CheckCircleOutlineRounded fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      ) : userParticipants.some(
                          (participant) =>
                            participant.event_uuid === row.event_uuid &&
                            participant.participant_roles?.length > 0,
                        ) ? (
                        <Tooltip
                          title={`You ${
                            row.event_status_name === 'Ready' ? 'are' : 'were'
                          } a participant`}
                        >
                          <IconButton>
                            <CheckCircleOutlineRounded
                              fontSize='small'
                              color='success'
                            />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {row.event_status_name === 'Complete' ||
                      // && userParticipants.some((participant) => participant.event_uuid === row.event_uuid && participant.participant_roles?.length > 0)
                      row.event_status_name === 'Ready' ? (
                        <Tooltip title='View event'>
                          <Link
                            component={RouterLink}
                            to={'/dashboard/event/' + row.event_uuid}
                            sx={{ textDecoration: 'none' }}
                          >
                            <IconButton>
                              <VisibilityIcon fontSize='small' />
                            </IconButton>
                          </Link>
                        </Tooltip>
                      ) : null}
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
        rowsPerPageOptions={[25, 50, 100]}
        component='div'
        count={nonRunningEvents ? nonRunningEvents.length : 1}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

/*
EventsListTable.propTypes = {
  orgEvents: PropTypes.array.isRequired
};
*/

export default EventsListTable;
