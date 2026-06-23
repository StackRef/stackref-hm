import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
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
import { EventEdit } from './EventEdit';
import useStackRef from 'src/hooks/useStackRef';
import { useConfirm } from 'material-ui-confirm';
import { dtmFormatted } from 'src/utils/dtmFormatting';

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
    disablePadding: true,
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
    id: 'balance_value',
    numeric: false,
    disablePadding: true,
    label: 'StackCash',
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
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
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
        <TableCell padding='checkbox'>
          <Checkbox
            color='primary'
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all events',
            }}
          />
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
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1.2em',
                }}
              >
                {headCell.label}
              </Typography>
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
  const { selectedEvents, setSelectedEvents, isSubmitting, setSubmitting } =
    props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const { removeFromOrgEvents } = useStackRef();
  const confirm = useConfirm();
  const theme = useTheme();

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(selectedEvents.length > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
      variant='dense'
    >
      {selectedEvents.length > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color='inherit'
          variant='subtitle1'
          component='div'
        >
          {selectedEvents.length} selected
        </Typography>
      ) : null}
      {
        selectedEvents.length > 0 ? (
          <Tooltip title='Delete'>
            <span>
              <IconButton
                disabled={isSubmitting}
                onClick={async () => {
                  confirm({
                    title: 'Delete events?',
                    content: `This will delete ${selectedEvents.length} selected events`,
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
                    .then(async () => {
                      try {
                        await selectedEvents?.forEach(async (eventUuid) => {
                          try {
                            if (isMountedRef.current) {
                              setSubmitting(true);
                              const payload = {
                                user: user,
                                action: 'archive',
                                event_uuid: eventUuid,
                              };
                              await EventEdit(payload, (error, response) => {
                                if (error)
                                  throw new Error('Event delete failed');
                              })
                                .then(() => {
                                  removeFromOrgEvents(eventUuid);
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
                        throw error;
                      }
                      setSubmitting(false);
                      setSelectedEvents([]);
                      toast.success('Events deleted', {
                        containerId: 'results',
                      });
                    })
                    .catch(() => {
                      console.error(`>> EventsListTable: ${error}`);
                      setSubmitting(false);
                      toast.error('Events delete failed', {
                        containerId: 'results',
                      });
                    });
                }}
              >
                <DeleteOutlinedIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        ) : null
        /* TODO
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        */
      }
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  selectedEvents: PropTypes.arrayOf(PropTypes.string),
};

const EventsListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    eventName: null,
  });
  const { user } = useAuth();
  const { orgEvents, removeFromOrgEvents } = useStackRef();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllEvents = (event) => {
    setSelectedEvents(
      event.target.checked
        ? orgEvents.map((orgEvent) => orgEvent.event_uuid)
        : [],
    );
  };

  const handleSelectOneEvent = (event, eventUuid) => {
    if (!selectedEvents.includes(eventUuid)) {
      setSelectedEvents((prevSelected) => [...prevSelected, eventUuid]);
    } else {
      setSelectedEvents((prevSelected) =>
        prevSelected.filter((uuid) => uuid !== eventUuid),
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

  const isSelected = (orgEvent) => selectedEvents.indexOf(orgEvent) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orgEvents.length) : 0;

  //const filteredEvents = applyFilters(orgEvents, query, filters);

  return (
    <Card>
      <CardHeader
        title='Events'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <EnhancedTableToolbar
          selectedEvents={selectedEvents}
          setSelectedEvents={setSelectedEvents}
          isSubmitting={isSubmitting}
          setSubmitting={setSubmitting}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby='tableTitle'
            size={'small'}
          >
            <EnhancedTableHead
              numSelected={selectedEvents.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllEvents}
              onRequestSort={handleRequestSort}
              rowCount={orgEvents ? orgEvents.length : 1}
            />
            <TableBody>
              {orgEvents
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
                      onClick={(event) =>
                        !isSubmitting &&
                        handleSelectOneEvent(event, row.event_uuid)
                      }
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.event_uuid}
                      selected={isItemSelected}
                    >
                      <TableCell padding='checkbox'>
                        <Checkbox
                          color='primary'
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        component='th'
                        id={labelId}
                        scope='row'
                        padding='none'
                      >
                        <Typography variant='body1'>{eventName}</Typography>
                        <Typography color='textSecondary' variant='body2'>
                          {eventSummary}
                        </Typography>
                      </TableCell>
                      <TableCell align='left'>
                        <Chip
                          label={row?.event_status_name}
                          color={
                            row?.event_status_name === 'Running'
                              ? 'success'
                              : row?.event_status_name === 'Judging'
                                ? 'warning'
                                : row?.event_status_name === 'Complete'
                                  ? 'secondary'
                                  : 'primary'
                          }
                        />
                      </TableCell>
                      <TableCell align='left'>{row.bank_balance}</TableCell>
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
                        {row.event_status_name !== 'Archived' &&
                        selectedEvents.length < 2 ? (
                          <>
                            <Tooltip title='Edit'>
                              <span>
                                <IconButton
                                  color='primary'
                                  component={RouterLink}
                                  disabled={isSubmitting}
                                  to={`/dashboard/admin/events/${row.event_uuid}`}
                                >
                                  <EditIcon fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title='Delete'>
                              <span>
                                <IconButton
                                  disabled={isSubmitting}
                                  color='primary'
                                  onClick={async () => {
                                    try {
                                      const payload = {};
                                      if (isMountedRef.current) {
                                        setSubmitting(true);
                                        payload['user'] = user;
                                        payload['action'] = 'archive';
                                        payload['event_uuid'] = row.event_uuid;

                                        await EventEdit(
                                          payload,
                                          (error, response) => {
                                            if (error)
                                              throw new Error(
                                                'Event delete failed',
                                              );
                                          },
                                        )
                                          .then(() => {
                                            toast.success('Event deleted', {
                                              containerId: 'results',
                                            });
                                            removeFromOrgEvents(row.event_uuid);
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
                                        `>> EventsListTable: ${error}`,
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
                        ) : (
                          <Box sx={{ py: 2.25, width: '72px' }} />
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
          rowsPerPageOptions={[25, 50, 100]}
          component='div'
          count={orgEvents ? orgEvents.length : 1}
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
EventsListTable.propTypes = {
  orgEvents: PropTypes.array.isRequired
};
*/

export default EventsListTable;
