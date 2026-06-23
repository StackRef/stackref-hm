import * as React from 'react';
import { useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  IconButton,
  Paper,
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
import { Field, Form, Formik } from 'formik';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import { visuallyHidden } from '@mui/utils';
import UpdateUserRoles from 'src/components/user/UpdateUserRoles';
import useStackRef from 'src/hooks/useStackRef';

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
];

function EditUserRoles(props) {
  const { selectedUser, orgDetails } = props;
  const userRoles = selectedUser.user_roles;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [editUserRolesOpen, setUserRolesOpen] = useState(false);
  const { initializeOrgUsers, orgUsers } = useStackRef();

  console.log(':: EditUserRoles');

  if (!orgDetails || !selectedUser) return null;

  const activeRoleIDs = orgDetails.user_roles.map((role) =>
    userRoles &&
    userRoles.filter((d) => d.user_role_id === role.user_role_id).length !== 0
      ? role.user_role_id.toString()
      : null,
  );

  /*
  const activeRoles = orgDetails.user_roles.map(role =>
    userRoles && userRoles.filter(d => d.user_role_id === role.user_role_id).length != 0 ? role : null
  );
  */

  const handleEditUserRolesClickOpen = () => {
    setUserRolesOpen(true);
  };

  const handleEditUserRolesClose = () => {
    setUserRolesOpen(false);
  };

  const payload = {};

  return (
    user.user_role_grants?.includes('organization_write') && (
      <Box sx={{ m: -1 }}>
        <IconButton
          onClick={handleEditUserRolesClickOpen}
          color='primary'
          sx={{ m: 1 }}
        >
          <EditIcon />
        </IconButton>
        <Dialog open={editUserRolesOpen} onClose={handleEditUserRolesClose}>
          <DialogTitle>Edit User Roles</DialogTitle>
          <Formik
            initialValues={{
              userUUID: selectedUser.user_uuid,
              organizationUUID: user.organization_uuid,
              userRoleIDs: activeRoleIDs.filter((v) => v), // Remove any null values
              submit: null,
            }}
            onSubmit={async (
              values,
              { setErrors, setStatus, setSubmitting },
            ) => {
              try {
                if (isMountedRef.current) {
                  payload['user'] = user;
                  payload['action'] = 'update_roles';
                  payload['user_uuid'] = values.userUUID;
                  payload['organization_uuid'] = values.organizationUUID;
                  payload['user_roles'] = values.userRoleIDs;

                  // Update the active Roles of user from the submitted form
                  const activeRoles = orgDetails.user_roles
                    .map((role) => {
                      return values.userRoleIDs.filter(
                        (d) => parseInt(d, 10) === role.user_role_id,
                      ).length !== 0
                        ? role
                        : null;
                    })
                    .filter((v) => v);

                  UpdateUserRoles(payload, (response) => {
                    if (!response || response.status_code !== 200)
                      throw new Error('User role update failed');
                  })
                    .then(() => {
                      initializeOrgUsers();
                      setUserRolesOpen(false);
                      setStatus({ success: true });
                      setSubmitting(false);
                      console.log(':: User roles updated');
                      toast.success('User roles updated', {
                        containerId: 'results',
                      });
                    })
                    .catch((err) => {
                      setStatus({ success: false });
                      setErrors({ submit: err.message });
                      setSubmitting(false);
                    });
                }
              } catch (err) {
                console.error(err);
                if (isMountedRef.current) {
                  setStatus({ success: false });
                  setErrors({ submit: err.message });
                  setSubmitting(false);
                }
              }
            }}
          >
            {({ errors, handleSubmit, isSubmitting, values }) => (
              <Form noValidate onSubmit={handleSubmit} {...props}>
                <DialogContent>
                  <DialogContentText
                    sx={{
                      mb: 1,
                    }}
                  >
                    Select the roles to assign to {selectedUser.first_name}{' '}
                    {selectedUser.last_name}
                  </DialogContentText>
                  <FormGroup>
                    {orgDetails.user_roles.map((role) => {
                      return (
                        <FormControlLabel
                          control={
                            <Field
                              defaultChecked={
                                userRoles &&
                                userRoles.filter(
                                  (d) => d.user_role_id === role.user_role_id,
                                ).length !== 0
                                  ? true
                                  : false
                              }
                              disabled={
                                userRoles &&
                                selectedUser.user_uuid === user.user_uuid &&
                                role.user_role_name === 'Owner'
                                  ? true
                                  : false
                              }
                              name='userRoleIDs'
                              value={role.user_role_id}
                              as={Checkbox}
                            />
                          }
                          key={role.user_role_id + '_dialog'}
                          label={role.user_role_name}
                        />
                      );
                    })}
                  </FormGroup>
                  <FormHelperText>
                    {userRoles &&
                    selectedUser.user_uuid === user.user_uuid &&
                    userRoles.filter((d) => d.user_role_name === 'Owner')
                      .length !== 0
                      ? 'Owners cannot remove themselves as owner'
                      : ''}
                  </FormHelperText>
                  <FormHelperText error>
                    {values.userRoleIDs.length === 0
                      ? 'User has no roles assigned'
                      : ''}
                  </FormHelperText>
                  {errors.submit && (
                    <Box sx={{ mt: 3 }}>
                      <FormHelperText error>{errors.submit}</FormHelperText>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button color='primary' disabled={isSubmitting} type='submit'>
                    OK
                  </Button>
                  <Button onClick={handleEditUserRolesClose}>Cancel</Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>
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
  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding='checkbox'>
          <Checkbox
            color='primary'
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
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
  const { numSelected } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color='inherit'
          variant='subtitle1'
          component='div'
        >
          {numSelected} selected
        </Typography>
      ) : (
        <></>
      )}
      {numSelected > 0 ? (
        <Tooltip title='Delete'>
          <IconButton>
            <DeleteOutlinedIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title='Filter list'>
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const UserListTable = (props) => {
  const { orgDetails, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('calories');
  const [selected, setSelected] = React.useState([]);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const { orgUsers } = useStackRef();
  const [filters, setFilters] = useState({
    userUUID: null,
    firstName: null,
    lastName: null,
    emailAddress: null,
  });
  const { user } = useAuth();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = orgUsers.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
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

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orgUsers.length) : 0;

  //const filteredUsers = applyFilters(orgUsers, query, filters);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
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
              rowCount={orgUsers.length}
            />
            <TableBody>
              {orgUsers
                .slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.user_uuid);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.user_uuid)}
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
                        {row.first_name}
                      </TableCell>
                      <TableCell align='left'>{row.last_name}</TableCell>
                      <TableCell align='left'>{row.email_address}</TableCell>
                      <TableCell align='left'>
                        {row.registered ? 'Registered' : 'Unregistered'}
                      </TableCell>
                      <TableCell align='left'>
                        {row.user_roles ? (
                          <ul>
                            {row.user_roles.map((role) => {
                              return (
                                <li key={role.user_role_id}>
                                  {role.user_role_name}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <i>None</i>
                        )}
                        <EditUserRoles
                          selectedUser={row}
                          orgDetails={orgDetails}
                        />
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
      </Paper>
    </Box>
  );
};

/*
UserListTable.propTypes = {
  orgUsers: PropTypes.array.isRequired
};
*/

export default UserListTable;
