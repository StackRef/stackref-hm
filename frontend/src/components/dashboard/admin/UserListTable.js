import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Checkbox,
  FormControl,
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
  Toolbar,
  Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalPoliceOutlinedIcon from '@mui/icons-material/LocalPoliceOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import UpdateUserRoles from 'src/components/user/UpdateUserRoles';
import UserEdit from 'src/components/user/UserEdit';
import useStackRef from 'src/hooks/useStackRef';
import { useConfirm } from 'material-ui-confirm';
import useIsMountedRef from 'use-is-mounted-ref';

const applyFilters = (orgUsers, query, filters) =>
  orgUsers.filter((orgUser) => {
    let matches = true;

    const firstName = orgUser.firstName;
    const lastName = orgUser.lastName;
    const emailAddress = orgUser.email_address;

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

    if (
      query &&
      !emailAddress.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    /*
    if (filters.userStatus) {
      if (filters.userStatus === 'ready' && orgUser.organization_user_status_name !== 'Ready') {
        matches = false;
      }

      if (filters.userStatus === 'claimed' && user.organization_user_status_name !== 'Claimed') {
        matches = false;
      }

      if (filters.userStatus === 'expired' && user.organization_user_status_name !== 'Expired') {
        matches = false;
      }

      if (filters.userStatus === 'invalidated' && user.organization_user_status_name !== 'Invalidated') {
        matches = false;
      }
    }
    */

    return matches;
  });

const applyPagination = (orgUsers, page, limit) =>
  orgUsers.slice(page * limit, page * limit + limit);

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
    disablePadding: true,
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
    id: 'email_address',
    numeric: false,
    disablePadding: false,
    label: 'E-Mail',
    sortable: true,
  },
  {
    id: 'registered',
    numeric: false,
    disablePadding: false,
    label: 'Status',
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

function EditUserRoles(props) {
  const { selectedUser, orgDetails, isSubmitting, setSubmitting, ...other } =
    props;
  const { initializeOrgUsers } = useStackRef();
  const userRoles = selectedUser.user_roles;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [activeRoles, setActiveRoles] = useState([]);
  const [newRoles, setNewRoles] = useState([]);

  console.log(':: EditUserRoles');

  if (!orgDetails || !selectedUser) return null;

  const handleChange = async (event) => {
    const selectedRole = event.target.value[0];
    // If value was already present, remove. If not, add.
    if (
      newRoles &&
      newRoles.some((d) => d.user_role_id === selectedRole.user_role_id)
    ) {
      console.log(`removed ${selectedRole.user_role_id}`);
      setNewRoles(
        newRoles.filter((d) => d.user_role_id !== selectedRole.user_role_id),
      );
    } else {
      console.log(`added ${selectedRole.user_role_id}`);
      setNewRoles((newRoles) => [...newRoles, selectedRole]);
    }
  };

  const handleClose = async () => {
    if (userRoles !== newRoles) {
      try {
        const payload = {};
        const newUserRoleIDs = newRoles.map((role) => role.user_role_id);
        if (isMountedRef.current) {
          setSubmitting(true);
          payload['user'] = user;
          payload['action'] = 'update_roles';
          payload['user_uuid'] = selectedUser.user_uuid;
          payload['organization_uuid'] = user.organization_uuid; // Handles only this current Organization
          payload['user_roles'] = newUserRoleIDs;

          await UpdateUserRoles(payload, (response) => {
            if (!response || response.status_code !== 200)
              throw new Error('User roles update failed');
          })
            .then(() => {
              initializeOrgUsers();
              toast.success('User roles updated', { containerId: 'results' });
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

  // Initialize selectedUser list of roles
  const handleOpen = () => {
    setActiveRoles([]);
    if (userRoles) setNewRoles(userRoles);
    else setNewRoles([]);
  };

  return user.user_role_grants?.includes('organization_write') ? (
    <Box sx={{ m: -1 }}>
      <Formik
        initialValues={{
          userUuid: selectedUser.user_uuid,
          organizationUuid: user.organization_uuid,
          submit: null,
        }}
      >
        {({ handleSubmit }) => (
          <Form noValidate onSubmit={handleSubmit} {...other}>
            <FormControl size='small' sx={{ m: 2, width: 150 }}>
              <InputLabel id='user-roles-label' shrink={false}>
                {userRoles
                  ? userRoles.some((d) => d.user_role_name === 'Owner')
                    ? 'Owner'
                    : userRoles.some((d) => d.user_role_name === 'Admin')
                      ? 'Admin'
                      : userRoles.some((d) => d.user_role_name === 'Standard')
                        ? 'Standard'
                        : 'None'
                  : 'None'}
                {userRoles && userRoles.length > 1
                  ? ' +' + (userRoles.length - 1).toString()
                  : ''}
              </InputLabel>
              <Select
                labelId='user-roles-label'
                disabled={isSubmitting}
                id='user-roles'
                multiple
                value={activeRoles}
                onChange={handleChange}
                onClose={handleClose}
                onOpen={handleOpen}
                input={<OutlinedInput />}
              >
                {orgDetails.user_roles.map((role) => {
                  return (
                    <MenuItem
                      key={role.user_role_id + '_dialog'}
                      label={role.user_role_name}
                      value={{
                        user_role_id: role.user_role_id,
                        user_role_name: role.user_role_name,
                      }}
                    >
                      <Checkbox
                        defaultChecked={
                          userRoles &&
                          userRoles.some(
                            (d) => d.user_role_id === role.user_role_id,
                          )
                            ? true
                            : false
                        }
                        disabled={
                          isSubmitting ||
                          (selectedUser.user_uuid === user.user_uuid &&
                            role.user_role_name === 'Owner')
                            ? true
                            : false
                        }
                        name='userRoleIDs'
                      />
                      <ListItemText
                        primary={role.user_role_name}
                        secondary={
                          userRoles &&
                          userRoles.some((d) => d.user_role_name === 'Owner') &&
                          selectedUser.user_uuid === user.user_uuid &&
                          role.user_role_name === 'Owner'
                            ? 'Owners cannot remove themselves as owner'
                            : ''
                        }
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Form>
        )}
      </Formik>
    </Box>
  ) : (
    ''
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
  } = props;
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
        <TableCell padding='checkbox'>
          <Checkbox
            color='primary'
            indeterminate={numSelected > 0 && numSelected < rowCount - 1}
            checked={rowCount > 1 && numSelected === rowCount - 1}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all users',
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
  const { selected, setSelected, isSubmitting, setSubmitting, disabled } =
    props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const { orgUsers, updateOrgUsers } = useStackRef();
  const confirm = useConfirm();
  const theme = useTheme();

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
        <Tooltip title='Remove'>
          <IconButton
            disabled={isSubmitting || disabled}
            onClick={async () => {
              confirm({
                title: 'Remove users?',
                content: `This will remove ${selected.length} selected users`,
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
                    selected?.forEach(async (userUuid) => {
                      try {
                        let payload = {};
                        if (isMountedRef.current) {
                          setSubmitting(true);
                          payload['user'] = user;
                          payload['action'] = 'remove_from_org';
                          payload['user_uuid'] = userUuid;
                          payload['organization_uuid'] = user.organization_uuid;

                          await UserEdit(payload, (response) => {
                            if (!response || response.status_code !== 200)
                              throw new Error('User removal failed');
                          })
                            .then(() => {
                              updateOrgUsers(
                                orgUsers.filter(
                                  (orgUser) => orgUser.user_uuid !== userUuid,
                                ),
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
                    console.error(`>> UserListTable: ${error}`);
                    setSubmitting(false);
                    toast.error('Users removal failed', {
                      containerId: 'results',
                    });
                  }
                })
                .then(async () => {
                  setSubmitting(false);
                  setSelected([]);
                  toast.success('Users removed', { containerId: 'results' });
                })
                .catch(() => {});
            }}
          >
            <DeleteOutlinedIcon fontSize='small' />
          </IconButton>
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

EnhancedTableToolbar.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string),
};

const UserListTable = (props) => {
  const { orgDetails, ...other } = props;
  const { orgUsers } = useStackRef();
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    userUuid: null,
    firstName: null,
    lastName: null,
    emailAddress: null,
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllUsers = async (event) => {
    setSelected(
      event.target.checked
        ? orgUsers
            .filter((orgUser) => orgUser.user_uuid !== user.user_uuid)
            .map((orgUser) => orgUser.user_uuid)
        : [],
    );
  };

  const handleSelectOneUser = (event, userUuid) => {
    if (userUuid !== user.user_uuid) {
      if (!selected.includes(userUuid)) {
        setSelected((prevSelected) => [...prevSelected, userUuid]);
      } else {
        setSelected((prevSelected) =>
          prevSelected.filter((uuid) => uuid !== userUuid),
        );
      }
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

  const handleUserStatusChange = (event) => {
    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      userStatus: value,
    }));
  };

  const isSelected = (orgUser) => selected.indexOf(orgUser) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orgUsers.length) : 0;

  //const filteredUsers = applyFilters(orgUsers, query, filters);

  return (
    <Card>
      <CardHeader
        title='Users'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <EnhancedTableToolbar
          selected={selected}
          setSelected={setSelected}
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
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllUsers}
              onRequestSort={handleRequestSort}
              rowCount={orgUsers.length}
            />
            <TableBody>
              {orgUsers
                ?.slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.user_uuid);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) =>
                        handleSelectOneUser(event, row.user_uuid)
                      }
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.user_uuid}
                      selected={isItemSelected}
                    >
                      <TableCell padding='checkbox'>
                        <Checkbox
                          color='primary'
                          checked={isItemSelected}
                          disabled={
                            isSubmitting || row.user_uuid === user.user_uuid
                          }
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                          sx={{
                            display:
                              row.user_uuid === user.user_uuid
                                ? 'none'
                                : 'inherit',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        component='th'
                        id={labelId}
                        scope='row'
                        padding='none'
                      >
                        {row.first_name}
                      </TableCell>
                      <TableCell align='left'>{row.last_name}</TableCell>
                      <TableCell align='left'>{row.email_address}</TableCell>
                      <TableCell align='left'>
                        {row.registered ? 'Registered' : 'Unregistered'}
                      </TableCell>
                      <TableCell align='left'>
                        <EditUserRoles
                          selectedUser={row}
                          orgDetails={orgDetails}
                          isSubmitting={isSubmitting}
                          setSubmitting={setSubmitting}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        {row.user_uuid !== user.user_uuid &&
                        selected.length < 2 ? (
                          <>
                            <Tooltip title='Delete'>
                              <IconButton
                                disabled={isSubmitting}
                                color='primary'
                                onClick={async () => {
                                  try {
                                    const payload = {};
                                    if (isMountedRef.current) {
                                      setSubmitting(true);
                                      payload['user'] = user;
                                      payload['action'] = 'remove_from_org';
                                      payload['user_uuid'] = row.user_uuid;
                                      payload['organization_uuid'] =
                                        user.organization_uuid;

                                      await UserEdit(payload, (response) => {
                                        if (
                                          !response ||
                                          response.status_code !== 200
                                        )
                                          throw new Error(
                                            'User removal failed',
                                          );
                                      })
                                        .then(() => {
                                          toast.success('User removed', {
                                            containerId: 'results',
                                          });
                                          initializeOrgUsers();
                                          setSubmitting(false);
                                        })
                                        .catch((err) => {
                                          toast.error(err.message, {
                                            containerId: 'results',
                                          });
                                          throw err;
                                        });
                                    }
                                  } catch (err) {
                                    console.error(`>> UserListTable: ${err}`);
                                    setSubmitting(false);
                                  }
                                }}
                              >
                                <DeleteOutlinedIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Box sx={{ py: 2.2, width: '72px' }} />
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
          count={orgUsers.length}
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
UserListTable.propTypes = {
  orgUsers: PropTypes.array.isRequired
};
*/

export default UserListTable;
