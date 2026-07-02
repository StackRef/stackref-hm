import { useEffect, useMemo, useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
} from '@mui/material';
import { Form, Formik } from 'formik';
import Tooltip from '@mui/material/Tooltip';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import { visuallyHidden } from '@mui/utils';
import useStackRef from 'src/hooks/useStackRef';
import AddIcon from '@mui/icons-material/Add';
import UpdateTeamMemberRoles from 'src/components/team/UpdateTeamMemberRoles';
import TeamMemberEdit from 'src/components/team/TeamMemberEdit';
import TeamMemberCreate from 'src/components/dashboard/event/TeamMemberCreate';
import CloudAccountUserDelete from 'src/components/dashboard/resource/CloudAccountUserDelete';
import { useTheme } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';

const applyFilters = (teamMembers, query, filters) =>
  teamMembers.filter((teamMember) => {
    let matches = true;

    const firstName = teamMember.firstName;
    const lastName = teamMember.lastName;

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

const applyPagination = (teamMembers, page, limit) =>
  teamMembers.slice(page * limit, page * limit + limit);

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
    id: 'actions',
    numeric: false,
    disablePadding: false,
    label: '',
    sortable: false,
  },
];

function EditTeamMemberRoles(props) {
  const { selectedTeamMember, ...other } = props;
  const { activeTeam, activeTeamMember, initializeTeamMembers } = useStackRef();
  const teamMemberRoles = selectedTeamMember.team_member_roles;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [activeRoles, setActiveRoles] = useState([]);
  const [newRoles, setNewRoles] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  console.log(':: EditTeamMemberRoles');

  if (!activeTeam || !selectedTeamMember) return null;

  const handleChange = async (event) => {
    const selectedRole = event.target.value[0];
    // If value was already present, remove. If not, add.
    if (
      newRoles &&
      newRoles.some(
        (d) => d.team_member_role_id === selectedRole.team_member_role_id,
      )
    ) {
      setNewRoles(
        newRoles.filter(
          (d) => d.team_member_role_id !== selectedRole.team_member_role_id,
        ),
      );
    } else {
      setNewRoles((newRoles) => [...newRoles, selectedRole]);
    }
  };

  const handleClose = async () => {
    if (teamMemberRoles !== newRoles) {
      try {
        const payload = {};
        const newTeamMemberRoleIDs = newRoles.map(
          (role) => role.team_member_role_id,
        );
        if (isMountedRef.current) {
          setSubmitting(true);
          payload['user'] = user;
          payload['action'] = 'update_roles';
          payload['team_uuid'] = selectedTeamMember.team_uuid;
          payload['team_member_uuid'] = selectedTeamMember.team_member_uuid;
          payload['team_member_roles'] = newTeamMemberRoleIDs;

          await UpdateTeamMemberRoles(payload, (response) => {
            if (!response || response.status_code !== 200)
              throw new Error('Team member roles update failed');
          })
            .then(() => {
              initializeTeamMembers();
              toast.success('Team member roles updated', {
                containerId: 'results',
              });
            })
            .catch((err) => {
              throw err;
            });
        }
      } catch (err) {
        console.error(`>> handleClose: ${err}`);
        setSubmitting(false);
        if (isMountedRef.current) {
          toast.error(err.message, { containerId: 'results' });
        }
      }
      setSubmitting(false);
    }
  };

  // Initialize selectedTeamMember list of roles
  const handleOpen = () => {
    setActiveRoles([]);
    if (teamMemberRoles) setNewRoles(teamMemberRoles);
    else setNewRoles([]);
  };

  return (
    activeTeamMember?.team_member_roles?.some(
      (role) => role.team_member_role_name === 'Captain',
    ) && (
      <Box sx={{ m: -1 }}>
        <Formik
          initialValues={{
            teamMemberUuid: selectedTeamMember.team_member_uuid,
            teamUuid: activeTeam.team_uuid,
            submit: null,
          }}
        >
          {({ handleSubmit }) => (
            <Form noValidate onSubmit={handleSubmit} {...other}>
              <FormControl size='small' sx={{ m: 2, width: 150 }}>
                <InputLabel id='team-member-roles-label' shrink={false}>
                  {teamMemberRoles
                    ? teamMemberRoles.some(
                        (d) => d.team_member_role_name === 'Captain',
                      )
                      ? 'Captain'
                      : teamMemberRoles.some(
                            (d) => d.team_member_role_name === 'Player',
                          )
                        ? 'Player'
                        : 'None'
                    : 'None'}
                  {teamMemberRoles && teamMemberRoles.length > 1
                    ? ' +' + (teamMemberRoles.length - 1).toString()
                    : ''}
                </InputLabel>
                <Select
                  disabled={isSubmitting}
                  labelId='team-member-roles-label'
                  id='team-member-roles'
                  multiple
                  value={activeRoles}
                  onChange={handleChange}
                  onClose={handleClose}
                  onOpen={handleOpen}
                  input={<OutlinedInput />}
                >
                  {activeTeam.team_member_roles.map((role) => {
                    return (
                      <MenuItem
                        key={role.team_member_role_id + '_dialog'}
                        label={role.team_member_role_name}
                        value={{
                          team_member_role_id: role.team_member_role_id,
                          team_member_role_name: role.team_member_role_name,
                        }}
                      >
                        <Checkbox
                          defaultChecked={
                            teamMemberRoles &&
                            teamMemberRoles.some(
                              (d) =>
                                d.team_member_role_id ===
                                role.team_member_role_id,
                            )
                              ? true
                              : false
                          }
                          name='teamMemberRoleIDs'
                        />
                        <ListItemText primary={role.team_member_role_name} />
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
  const { order, orderBy, rowCount, onRequestSort } = props;
  const theme = useTheme();

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
        <TableCell />
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
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const TeamMemberListTable = (props) => {
  const {
    activeTeam,
    participants,
    teamMembers,
    initializeTeamMembers,
    initializeParticipants,
  } = useStackRef();
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState([]);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [newTeamMemberRole, setNewTeamMemberRole] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    teamMemberUuid: null,
    firstName: null,
    lastName: null,
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {}, [initializeParticipants]);

  useEffect(() => {
    async function initialize() {
      if (activeTeam) {
        await initializeParticipants();
        await initializeTeamMembers(activeTeam.team_uuid);
      }
    }
    initialize();
  }, [activeTeam, initializeParticipants, initializeTeamMembers]);

  const participantPlayers = useMemo(() => {
    return participants?.filter((participant) =>
      participant.participant_roles.find(
        (role) => role.participant_role_name === 'Player',
      ),
    );
  }, [participants]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
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

  const handleNewTeamMemberChange = (event) => {
    setNewTeamMember(event.target.value);
  };

  const handleNewTeamMemberRoleChange = (event) => {
    setNewTeamMemberRole(event.target.value);
  };

  const handleAddNewTeamMember = async (event) => {
    if (newTeamMember.participant_uuid) {
      console.log(
        `:: handleAddNewTeamMember: ${newTeamMember.participant_uuid} to ${activeTeam.team_uuid}`,
      );
      try {
        setSubmitting(true);
        const payload = {};
        payload['user'] = user;
        payload['action'] = 'create';
        payload['participant_uuid'] = newTeamMember.participant_uuid;
        payload['team_uuid'] = activeTeam.team_uuid;
        payload['team_member_role_id'] = newTeamMemberRole;

        await TeamMemberCreate(payload, (response) => {
          if (!response || response.status_code !== 200)
            throw new Error('Team member add failed');
        })
          .then(() => {
            toast.success('Team Member added', { containerId: 'results' });
            setNewTeamMember('');
            setNewTeamMemberRole(1); // TODO: Do not hardcode
            initializeParticipants(eventUuid);
            initializeTeamMembers(activeTeam.team_uuid);
          })
          .catch((error) => {
            toast.error(error.message, { containerId: 'results' });
          });
      } catch (error) {
        console.error(`>> handleNewTeamMember: ${error}`);
      }
      setSubmitting(false);
    }
  };

  const handleTeamMemberStatusChange = (event) => {
    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      teamMemberStatus: value,
    }));
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    teamMembers && page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - teamMembers.length)
      : 0;

  return (
    <Card>
      <CardHeader
        title='Team Members'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
        }}
      />
      <CardContent>
        <TableContainer>
          <Table
            sx={{ minWidth: 550 }}
            aria-labelledby='tableTitle'
            size={'small'}
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={teamMembers ? teamMembers.length : 1}
            />
            <TableBody>
              {teamMembers
                ?.slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) =>
                        handleClick(event, row.team_member_uuid)
                      }
                      tabIndex={-1}
                      key={row.team_member_uuid}
                    >
                      <TableCell>
                        {row.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Captain',
                        ) && (
                          <Tooltip title='Captain'>
                            <StarsOutlinedIcon
                              variant='small'
                              color='primary'
                            />
                          </Tooltip>
                        )}
                        {row.team_member_roles?.some(
                          (d) => d.team_member_role_name === 'Player',
                        ) && (
                          <Tooltip title='Player'>
                            <AccountCircleOutlinedIcon
                              variant='small'
                              color='primary'
                            />
                          </Tooltip>
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
                        <EditTeamMemberRoles
                          selectedTeamMember={row}
                          team={activeTeam}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='Remove'>
                          <IconButton
                            color='primary'
                            disabled={isSubmitting}
                            onClick={async () => {
                              try {
                                const payload = {};
                                if (isMountedRef.current) {
                                  setSubmitting(true);
                                  payload['user'] = user;
                                  payload['action'] = 'delete';
                                  payload['team_member_uuid'] =
                                    row.team_member_uuid;
                                  payload['team_uuid'] = row.team_uuid;

                                  // FIRST remove their Cloud Account User
                                  payload['entity_uuid'] = row.team_uuid;
                                  await CloudAccountUserDelete(
                                    payload,
                                    (response) => {
                                      //if (!response || response.status_code !== 200)
                                      if (!response)
                                        throw new Error(
                                          'Team member cloud account removal failed',
                                        );
                                    },
                                  )
                                    .then(() => {
                                      console.log(
                                        ':: Team member removed from cloud account',
                                      );
                                      //toast.success('Team member removed from cloud account', {containerId: 'results'});
                                    })
                                    .catch((error) => {
                                      console.error(
                                        `>> CloudAccountUserDelete: ${error}`,
                                      );
                                      //toast.error(error.message, {containerId: 'results'});
                                    });

                                  // THEN remove the team member
                                  await TeamMemberEdit(payload, (response) => {
                                    if (
                                      !response ||
                                      response.status_code !== 200
                                    )
                                      throw new Error(
                                        'Team member delete failed',
                                      );
                                  })
                                    .then(() => {
                                      toast.success('Team member removed', {
                                        containerId: 'results',
                                      });
                                      initializeTeamMembers(row.team_uuid);
                                      initializeParticipants(eventUuid);
                                    })
                                    .catch((error) => {
                                      toast.error(error.message, {
                                        containerId: 'results',
                                      });
                                    });

                                  setSubmitting(false);
                                }
                              } catch (error) {
                                console.error(
                                  `>> TeamMemberListTable: ${error}`,
                                );
                              }
                            }}
                          >
                            <DeleteOutlinedIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
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
            {!participantPlayers ? (
              ''
            ) : teamMembers &&
              participantPlayers.length <= teamMembers.length ? (
              ''
            ) : (
              <FormControl variant='standard' sx={{ m: 1, minWidth: 130 }}>
                <Grid container spacing={2}>
                  <Grid item>
                    <TextField
                      disabled={isSubmitting}
                      select
                      SelectProps={{
                        displayEmpty: false,
                      }}
                      helperText='Add a new team member'
                      id='newTeamMember'
                      value={newTeamMember}
                      onChange={handleNewTeamMemberChange}
                      sx={{
                        minWidth: 250,
                      }}
                    >
                      {participantPlayers.map((participant, index) => {
                        if (!participant.participant_teams) {
                          // Participant is not already a Team Member
                          return (
                            <MenuItem
                              key={participant.participant_uuid}
                              value={participant}
                              sx={{
                                fontSize: '0.8em',
                              }}
                            >
                              {participant.first_name} {participant.last_name}
                            </MenuItem>
                          );
                        }
                      })}
                    </TextField>
                  </Grid>
                  <Grid item>
                    <TextField
                      disabled={isSubmitting}
                      select
                      id='addNewTeamMemberRole'
                      SelectProps={{
                        displayEmpty: false,
                      }}
                      value={newTeamMemberRole}
                      onChange={handleNewTeamMemberRoleChange}
                      helperText='Initial role'
                      sx={{
                        minWidth: 150,
                      }}
                    >
                      {activeTeam?.team_member_roles?.map((role) => {
                        return (
                          <MenuItem
                            key={role.team_member_role_id + '_dialog'}
                            label={role.team_member_role_name}
                            value={role.team_member_role_id}
                          >
                            {role.team_member_role_name}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      color='primary'
                      disabled={newTeamMember ? false : true}
                      loading={isSubmitting}
                      startIcon={<AddIcon fontSize='small' />}
                      variant='contained'
                      onClick={handleAddNewTeamMember}
                    >
                      Add
                    </LoadingButton>
                  </Grid>
                </Grid>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={6}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 100]}
              component='div'
              count={teamMembers ? teamMembers.length : 1}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

/*
TeamMemberListTable.propTypes = {
  teamMembers: PropTypes.array.isRequired
};
*/

export default TeamMemberListTable;
