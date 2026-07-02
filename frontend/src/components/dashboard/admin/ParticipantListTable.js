import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'use-is-mounted-ref';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { visuallyHidden } from '@mui/utils';
import useStackRef from 'src/hooks/useStackRef';
import AddIcon from '@mui/icons-material/Add';
import UpdateParticipantRoles from 'src/components/participant/UpdateParticipantRoles';
import ParticipantEdit from 'src/components/participant/ParticipantEdit';
import ParticipantCreate from './ParticipantCreate';
import { useConfirm } from 'material-ui-confirm';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'src/store';
import { getParticipants } from 'src/slices/participants';

const applyFilters = (eventParticipants, query, filters) =>
  eventParticipants.filter((participant) => {
    let matches = true;

    const firstName = orgUser.firstName;
    const lastName = orgUser.lastName;

    if (
      query &&
      !firstName.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    if (
      query &&
      !lastName.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });

const applyPagination = (eventParticipants, page, limit) =>
  eventParticipants.slice(page * limit, page * limit + limit);

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
    id: 'first_name',
    numeric: false,
    disablePadding: false,
    label: 'First Name',
    sortable: true,
  },
  {
    id: 'last_name',
    numeric: false,
    disablePadding: false,
    label: 'Last Name',
    sortable: true,
  },
  {
    id: 'roles',
    numeric: false,
    disablePadding: false,
    label: 'Roles',
    sortable: false,
  },
  {
    id: 'user_skill_tags',
    numeric: false,
    disablePadding: false,
    label: 'Skills',
    sortable: false,
  },
  {
    id: 'actions',
    numeric: false,
    disablePadding: false,
    label: '',
    sortable: false,
  },
];

function EditParticipantRoles(props) {
  const {
    selectedParticipant,
    isSubmitting,
    setSubmitting,
    disabled,
    ...other
  } = props;
  const participantRoles = selectedParticipant.participant_roles;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [activeRoles, setActiveRoles] = useState([]);
  const [newRoles, setNewRoles] = useState([]);
  const dispatch = useDispatch();
  const orgEvent = useSelector((state) => state.orgEvent);

  console.log(':: EditParticipantRoles');

  if (!orgEvent.data || !selectedParticipant) return null;

  const handleChange = async (event) => {
    const selectedRole = event.target.value[0];
    // If value was already present, remove. If not, add.
    if (
      newRoles &&
      newRoles.some(
        (d) => d.participant_role_id === selectedRole.participant_role_id,
      )
    ) {
      setNewRoles(
        newRoles.filter(
          (d) => d.participant_role_id !== selectedRole.participant_role_id,
        ),
      );
    } else {
      setNewRoles((newRoles) => [...newRoles, selectedRole]);
    }
  };

  const handleClose = async () => {
    if (participantRoles !== newRoles) {
      try {
        const payload = {};
        const newParticipantRoleIDs = newRoles?.map(
          (role) => role.participant_role_id,
        );
        if (isMountedRef.current) {
          setSubmitting(true);
          payload['user'] = user;
          payload['action'] = 'update_roles';
          payload['participant_uuid'] = selectedParticipant.participant_uuid;
          payload['event_uuid'] = selectedParticipant.event_uuid;
          payload['participant_roles'] = newParticipantRoleIDs;

          await UpdateParticipantRoles(payload, (response) => {
            if (!response || response.status_code !== 200)
              throw new Error('Participant roles update failed');
          })
            .then(() => {
              dispatch(
                getParticipants({
                  user: user,
                  eventUuid: selectedParticipant.event_uuid,
                }),
              );
              toast.success('Participant roles updated', {
                containerId: 'results',
              });
              setSubmitting(false);
            })
            .catch((err) => {
              throw err;
            });
        }
      } catch (err) {
        console.error(err);
        if (isMountedRef.current) {
          toast.error(err.message, { containerId: 'results' });
        }
        setSubmitting(false);
      }
    }
  };

  // Initialize selectedParticipant list of roles
  const handleOpen = () => {
    setActiveRoles([]);
    if (participantRoles) setNewRoles(participantRoles);
    else setNewRoles([]);
  };

  return (
    user.user_role_grants?.includes('organization_write') && (
      <Box sx={{ m: -1 }}>
        <Formik
          initialValues={{
            participantUuid: selectedParticipant.participant_uuid,
            eventUuid: selectedParticipant.event_uuid,
            submit: null,
          }}
        >
          {({ handleSubmit }) => (
            <Form noValidate onSubmit={handleSubmit} {...other}>
              <FormControl size='small' sx={{ m: 2, width: 150 }}>
                <InputLabel id='participant-roles-label' shrink={false}>
                  {participantRoles
                    ? participantRoles.some(
                        (d) => d.participant_role_name === 'Manager',
                      )
                      ? 'Manager'
                      : participantRoles.some(
                            (d) => d.participant_role_name === 'Judge',
                          )
                        ? 'Judge'
                        : participantRoles.some(
                              (d) => d.participant_role_name === 'SME',
                            )
                          ? 'SME'
                          : participantRoles.some(
                                (d) => d.participant_role_name === 'Player',
                              )
                            ? 'Player'
                            : participantRoles.some(
                                  (d) =>
                                    d.participant_role_name === 'Spectator',
                                )
                              ? 'Spectator'
                              : participantRoles.some(
                                    (d) =>
                                      d.participant_role_name === 'Free Agent',
                                  )
                                ? 'Free Agent'
                                : 'None'
                    : 'None'}
                  {participantRoles?.length > 1
                    ? ' +' + (participantRoles.length - 1).toString()
                    : ''}
                </InputLabel>
                <Select
                  labelId='participant-roles-label'
                  disabled={isSubmitting || disabled}
                  id='participant-roles'
                  multiple
                  value={activeRoles}
                  onChange={handleChange}
                  onClose={handleClose}
                  onOpen={handleOpen}
                  input={<OutlinedInput />}
                >
                  {orgEvent.data.participant_roles?.map((role) => {
                    return (
                      <MenuItem
                        disabled={isSubmitting || disabled}
                        key={role.participant_role_id + '_dialog'}
                        label={role.participant_role_name}
                        value={{
                          participant_role_id: role.participant_role_id,
                          participant_role_name: role.participant_role_name,
                        }}
                      >
                        <Checkbox
                          disabled={isSubmitting || disabled}
                          defaultChecked={
                            participantRoles &&
                            participantRoles.some(
                              (d) =>
                                d.participant_role_id ===
                                role.participant_role_id,
                            )
                              ? true
                              : false
                          }
                          name='participantRoleIDs'
                        />
                        <ListItemText primary={role.participant_role_name} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Form>
          )}
        </Formik>
      </Box>
    )
  );
}

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

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
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
                'aria-label': 'select all participants',
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
            variant='head'
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
  onRequestSort: PropTypes.func.isRequired,
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
  const dispatch = useDispatch();

  return (
    <Toolbar
      sx={{
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
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
        <Tooltip title='Remove'>
          <span>
            <IconButton
              disabled={isSubmitting || disabled}
              onClick={async () => {
                confirm({
                  title: 'Remove participants?',
                  content: `This will remove ${selected.length} selected participants`,
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
                      selected?.forEach(async (participantUuid) => {
                        try {
                          let payload = {};
                          if (isMountedRef.current) {
                            setSubmitting(true);
                            payload['user'] = user;
                            payload['action'] = 'delete';
                            payload['participant_uuid'] = participantUuid;

                            await ParticipantEdit(payload, (response) => {
                              if (!response || response.status_code !== 200)
                                throw new Error('Participant removal failed');
                            })
                              .then(() => {
                                dispatch(
                                  getParticipants({
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
                      console.error(`>> ParticipantListTable: ${error}`);
                      toast.error('Participant removal failed', {
                        containerId: 'results',
                      });
                      setSubmitting(false);
                    }
                  })
                  .then(async () => {
                    setSelected([]);
                    setSubmitting(false);
                    toast.success('Participants removed', {
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
          <IconButton color="primary">
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        */
      )}
    </Toolbar>
  );
};

/*
EnhancedTableToolbar.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string)
};
*/

const ParticipantListTable = (props) => {
  const { ...other } = props;
  const { orgUsers, initializeOrgUsers } = useStackRef();
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState(2);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    participantUuid: null,
    firstName: null,
    lastName: null,
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [participantsStatus, setParticipantsStatus] = useState();
  const dispatch = useDispatch();
  const orgEvent = useSelector((state) => state.orgEvent);
  const participants = useSelector((state) => state.participants);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        await Promise.all([
          initializeOrgUsers(),
          dispatch(
            getParticipants({
              user: user,
              eventUuid: orgEvent.data.event_uuid,
            }),
          ),
        ]);
      } catch (error) {
        console.error('>> initialize: ', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasPlayer = participants.data.some((obj) => {
      const playerRole = obj.participant_roles?.find(
        (role) => role.participant_role_name === 'Player',
      );
      return !!playerRole;
    });

    const hasJudge = participants.data.some((obj) => {
      const judgeRole = obj.participant_roles?.find(
        (role) => role.participant_role_name === 'Judge',
      );
      return !!judgeRole;
    });

    if (!hasPlayer && !hasJudge) {
      setParticipantsStatus('No players or judges assigned');
    } else if (!hasPlayer) {
      setParticipantsStatus('No players assigned');
    } else if (!hasJudge) {
      setParticipantsStatus('No judges assigned');
    } else {
      setParticipantsStatus(null);
    }
  }, [participants]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllParticipants = (event) => {
    setSelected(
      event.target.checked
        ? participants.data.map((participant) => participant.participant_uuid)
        : [],
    );
  };

  const handleSelectOneParticipant = (event, participantUuid) => {
    if (!selected.includes(participantUuid)) {
      setSelected((prevSelected) => [...prevSelected, participantUuid]);
    } else {
      setSelected((prevSelected) =>
        prevSelected.filter((id) => id !== participantUuid),
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

  const handleNewParticipantChange = (event) => {
    setNewParticipant(event.target.value);
  };

  const handleNewParticipantRoleChange = (event) => {
    setNewParticipantRole(event.target.value);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const handleAddNewParticipant = async (event) => {
    if (newParticipant?.user_uuid) {
      console.log(
        `:: handleAddNewParticipant: ${newParticipant.user_uuid} to ${orgEvent.data.event_uuid}`,
      );
      try {
        setSubmitting(true);
        const payload = {};
        payload['user'] = user;
        payload['action'] = 'create';
        payload['user_uuid'] = newParticipant.user_uuid;
        payload['event_uuid'] = orgEvent.data.event_uuid;
        payload['participant_role_id'] = newParticipantRole;

        await ParticipantCreate(payload, (response) => {
          if (!response || response.status_code !== 200)
            throw new Error('Participant add failed');
        })
          .then(() => {
            toast.success('Participant added', { containerId: 'results' });
            setNewParticipant('');
            setNewParticipantRole(2);
            dispatch(
              getParticipants({
                user: user,
                eventUuid: orgEvent.data.event_uuid,
              }),
            );
            setSubmitting(false);
          })
          .catch((error) => {
            toast.error(error.message, { containerId: 'results' });
          });
      } catch (error) {
        console.error(`>> handleNewParticipant: ${error}`);
        setSubmitting(false);
      }
    }
  };

  const handleParticipantStatusChange = (event) => {
    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      participantStatus: value,
    }));
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    participants.data && page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - participants.data.length)
      : 0;

  return (
    <Card
      sx={{
        m: 'auto',
        width: '100%',
      }}
    >
      <CardHeader
        title='Event Participants'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 2,
        }}
        subheader={
          participantsStatus ? (
            <Chip color='error' label={participantsStatus} />
          ) : null
        }
      />
      <CardContent>
        <Box>
          <TableContainer>
            <EnhancedTableToolbar
              selected={selected}
              setSelected={setSelected}
              isSubmitting={isSubmitting}
              setSubmitting={setSubmitting}
              disabled={
                isSubmitting ||
                ['Complete', 'Archived'].includes(
                  orgEvent.data.event_status_name,
                )
              }
            />
            <Table
              sx={{
                minWidth: 550,
              }}
              aria-labelledby='tableTitle'
              size={'small'}
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllParticipants}
                onRequestSort={handleRequestSort}
                rowCount={participants.data ? participants.data.length : 1}
                disabled={
                  isSubmitting ||
                  ['Complete', 'Archived'].includes(
                    orgEvent.data.event_status_name,
                  )
                }
              />
              <TableBody>
                {participants.data
                  ?.slice()
                  .sort(getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const isItemSelected = isSelected(row.participant_uuid);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={(event) =>
                          !isSubmitting &&
                          !['Complete', 'Archived'].includes(
                            orgEvent.data.event_status_name,
                          ) &&
                          handleSelectOneParticipant(
                            event,
                            row.participant_uuid,
                          )
                        }
                        role='checkbox'
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.participant_uuid}
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
                          padding='normal'
                        >
                          {row.first_name}
                        </TableCell>
                        <TableCell align='left'>{row.last_name}</TableCell>
                        <TableCell align='left'>
                          <EditParticipantRoles
                            selectedParticipant={row}
                            isSubmitting={isSubmitting}
                            setSubmitting={setSubmitting}
                            disabled={
                              isSubmitting ||
                              ['Complete', 'Archived'].includes(
                                orgEvent.data.event_status_name,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction='row'
                            flexWrap='wrap'
                            spacing={1}
                            maxWidth={400}
                          >
                            {row.user_tags?.skills?.map((tag) => {
                              return (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  variant='outlined'
                                />
                              );
                            })}
                          </Stack>
                        </TableCell>
                        <TableCell align='right'>
                          {['Complete', 'Archived'].includes(
                            orgEvent.data.event_status_name,
                          ) ? null : selected.length > 1 ? (
                            <Box sx={{ py: 2.2, width: '37px' }} />
                          ) : (
                            <Tooltip title='Remove'>
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
                                        payload['action'] = 'delete';
                                        payload['participant_uuid'] =
                                          row.participant_uuid;
                                        payload['event_uuid'] = row.event_uuid;

                                        await ParticipantEdit(
                                          payload,
                                          (response) => {
                                            if (
                                              !response ||
                                              response.status_code !== 200
                                            )
                                              throw new Error(
                                                'Event participant delete failed',
                                              );
                                          },
                                        )
                                          .then(() => {
                                            toast.success(
                                              'Event participant removed',
                                              { containerId: 'results' },
                                            );
                                            setSelected([]);
                                            dispatch(
                                              getParticipants({
                                                user: user,
                                                eventUuid: row.event_uuid,
                                              }),
                                            );
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
                                        `>> ParticipantListTable: ${error}`,
                                      );
                                      setSubmitting(false);
                                    }
                                  }}
                                >
                                  <DeleteOutlinedIcon fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
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
          <Grid container>
            <Grid item xs={6}>
              {!orgUsers ? (
                ''
              ) : participants.data &&
                orgUsers.length <= participants.data.length ? (
                ''
              ) : (
                <FormControl sx={{ m: 1, minWidth: 250 }} variant='standard'>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      alignItems: 'center',
                    }}
                  >
                    <Grid item>
                      <TextField
                        select
                        id='newParticipant'
                        SelectProps={{
                          displayEmpty: false,
                        }}
                        disabled={
                          isSubmitting ||
                          ['Complete', 'Archived'].includes(
                            orgEvent.data.event_status_name,
                          )
                        }
                        value={newParticipant}
                        onChange={handleNewParticipantChange}
                        helperText='Add a new participant'
                        sx={{
                          minWidth: 250,
                        }}
                      >
                        {orgUsers.map((orgUser, index) => {
                          if (
                            !participants.data ||
                            participants.data.findIndex(
                              (participant) =>
                                participant.user_uuid === orgUser.user_uuid,
                            ) === -1
                          ) {
                            // User is not already a Participant
                            return (
                              <MenuItem
                                disabled={
                                  isSubmitting ||
                                  ['Complete', 'Archived'].includes(
                                    orgEvent.data.event_status_name,
                                  )
                                }
                                key={orgUser.user_uuid}
                                value={orgUser}
                                sx={{
                                  fontSize: '0.8em',
                                }}
                              >
                                {orgUser.first_name} {orgUser.last_name}
                              </MenuItem>
                            );
                          }
                        })}
                      </TextField>
                    </Grid>
                    <Grid item>
                      <TextField
                        select
                        id='addNewParticipantRole'
                        SelectProps={{
                          displayEmpty: false,
                        }}
                        disabled={
                          isSubmitting ||
                          ['Complete', 'Archived'].includes(
                            orgEvent.data.event_status_name,
                          )
                        }
                        value={newParticipantRole}
                        onChange={handleNewParticipantRoleChange}
                        helperText='Initial role'
                        sx={{
                          minWidth: 150,
                        }}
                      >
                        {orgEvent.data.participant_roles?.map((role) => {
                          return (
                            <MenuItem
                              key={role.participant_role_id + '_dialog'}
                              label={role.participant_role_name}
                              value={role.participant_role_id}
                              disabled={
                                isSubmitting ||
                                ['Complete', 'Archived'].includes(
                                  orgEvent.data.event_status_name,
                                )
                              }
                              sx={{
                                fontSize: '0.8em',
                              }}
                            >
                              {role.participant_role_name}
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </Grid>
                    <Grid item>
                      <Button
                        color='primary'
                        disabled={
                          ['Complete', 'Archived'].includes(
                            orgEvent.data.event_status_name,
                          )
                            ? true
                            : newParticipant && !isSubmitting
                              ? false
                              : true
                        }
                        startIcon={<AddIcon fontSize='small' />}
                        variant='contained'
                        onClick={handleAddNewParticipant}
                        sx={{
                          mb: '20px',
                        }}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={6}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component='div'
                count={participants.data ? participants.data.length : 1}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

/*
ParticipantListTable.propTypes = {
  participants: PropTypes.array.isRequired
};
*/

export default ParticipantListTable;
