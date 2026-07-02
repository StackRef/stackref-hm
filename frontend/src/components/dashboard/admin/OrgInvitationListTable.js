import { useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import Scrollbar from 'src/components/Scrollbar';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import InvalidateOrgInvitation from 'src/components/organization/InvalidateOrgInvitation';
import ResendOrgInvitation from 'src/components/organization/ResendOrgInvitation';
import { useConfirm } from 'material-ui-confirm';
import useIsMountedRef from 'use-is-mounted-ref';
import { useDispatch, useSelector } from 'src/store';
import { removeFromOrgInvitations } from 'src/slices/orgInvitations';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const invitationStatusOptions = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'Ready',
    value: 'ready',
  },
  {
    label: 'Send Success',
    value: 'sendsuccess',
  },
  {
    label: 'Send Failure',
    value: 'sendfailure',
  },
  {
    label: 'Claimed',
    value: 'claimed',
  },
  {
    label: 'Hold',
    value: 'hold',
  },
  {
    label: 'Expired',
    value: 'expired',
  },
  {
    label: 'Invalidated',
    value: 'invalidated',
  },
];

const sortOptions = [
  {
    label: 'Expires/claimed date (newest first)',
    value: 'updatedAt|desc',
  },
  {
    label: 'Expires/claimed date (oldest first)',
    value: 'updatedAt|asc',
  },
];

const applyFilters = (invitations, query, filters) =>
  invitations.filter((invitation) => {
    let matches = true;

    const invitationEmail = invitation.invitation_email;

    if (
      query &&
      !invitationEmail.toString().toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    if (filters.invitationStatus) {
      if (
        filters.invitationStatus === 'expired' &&
        !invitation.invitation_expired
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'ready' &&
        (invitation.invitation_expired ||
          invitation.organization_invitation_status_name !== 'Ready')
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'claimed' &&
        invitation.organization_invitation_status_name !== 'Claimed'
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'invalidated' &&
        invitation.organization_invitation_status_name !== 'Invalidated'
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'sendsuccess' &&
        invitation.organization_invitation_status_name !== 'Send Success'
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'sendfailure' &&
        invitation.organization_invitation_status_name !== 'Send Failure'
      ) {
        matches = false;
      }

      if (
        filters.invitationStatus === 'hold' &&
        invitation.organization_invitation_status_name !== 'On Hold'
      ) {
        matches = false;
      }
    }

    return matches;
  });

const applyPagination = (invitations, page, limit) =>
  invitations.slice(page * limit, page * limit + limit);

const EnhancedTableToolbar = (props) => {
  const {
    selectedInvitations,
    setSelectedInvitations,
    isSubmitting,
    setSubmitting,
  } = props;
  const { user } = useAuth();
  const confirm = useConfirm();
  const theme = useTheme();
  const dispatch = useDispatch();

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(selectedInvitations.length > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
      variant='dense'
    >
      {selectedInvitations.length > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color='inherit'
          variant='subtitle1'
          component='div'
        >
          {selectedInvitations.length} selected
        </Typography>
      ) : (
        <></>
      )}
      {selectedInvitations.length > 0 ? (
        <Tooltip title='Invalidate'>
          <span>
            <IconButton
              disabled={isSubmitting}
              onClick={async () => {
                confirm({
                  title: 'Invalidate invitations?',
                  content: `This will invalidate ${selectedInvitations.length} selected invitations`,
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
                      selectedInvitations?.forEach(async (invitationUuid) => {
                        try {
                          setSubmitting(true);
                          const invalidatePayload = {};
                          invalidatePayload['user'] = user;
                          invalidatePayload['action'] = 'invalidate';
                          invalidatePayload['organization_uuid'] =
                            user.organization_uuid;
                          invalidatePayload['organization_invitation_uuid'] =
                            invitationUuid;

                          await InvalidateOrgInvitation(
                            invalidatePayload,
                            (response) => {
                              if (!response || response.status_code !== 200)
                                throw new Error(
                                  'Invitation invalidation failed',
                                );
                            },
                          )
                            .then(() => {
                              dispatch(
                                removeFromOrgInvitations(invitationUuid),
                              );
                            })
                            .catch((error) => {
                              throw error;
                            });
                        } catch (error) {
                          throw error;
                        }
                      });
                    } catch (error) {
                      setSubmitting(false);
                      console.error(`>> OrgInvitationListTable: ${error}`);
                      toast.error('Invitations invalidation failed', {
                        containerId: 'results',
                      });
                    }
                  })
                  .then(async () => {
                    setSubmitting(false);
                    setSelectedInvitations([]);
                    toast.success('Invitations invalidated', {
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
        /* TODO?
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

/*
EnhancedTableToolbar.propTypes = {
  selectedInvitations: PropTypes.arrayOf(PropTypes.string)
};
*/

const OrgInvitationListTable = (props) => {
  const { ...other } = props;
  const [selectedInvitations, setSelectedInvitations] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(sortOptions[0].value);
  const [filters, setFilters] = useState({
    invitationUuid: null,
    invitationStatus: 'ready',
    invitationEmail: null,
  });
  const [copiedKey, setCopiedKey] = useState();
  const { user } = useAuth();
  const orgInvitations = useSelector((state) => state.orgInvitations);
  const dispatch = useDispatch();
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleInvitationStatusChange = (event) => {
    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      invitationStatus: value,
    }));
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
  };

  const handleSelectAllInvitations = (event) => {
    setSelectedInvitations(
      event.target.checked
        ? paginatedInvitations.map(
            (invitation) => invitation.organization_invitation_uuid,
          )
        : [],
    );
  };

  const handleSelectOneInvitation = (event, invitationUuid) => {
    if (!selectedInvitations.includes(invitationUuid)) {
      setSelectedInvitations((prevSelected) => [
        ...prevSelected,
        invitationUuid,
      ]);
    } else {
      setSelectedInvitations((prevSelected) =>
        prevSelected.filter((id) => id !== invitationUuid),
      );
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
  };

  const filteredInvitations = applyFilters(orgInvitations.data, query, filters);
  const paginatedInvitations = applyPagination(
    filteredInvitations,
    page,
    limit,
  );
  const selectedSomeInvitations =
    selectedInvitations.length > 0 &&
    selectedInvitations.length < orgInvitations.length;
  const selectedAllInvitations =
    paginatedInvitations.length > 0 &&
    selectedInvitations.length === paginatedInvitations.length;

  const [copyTooltipText, setCopyTooltipText] = useState('Copy');

  const CopyTooltipText = () => {
    setCopyTooltipText('COPIED!');
    setTimeout(() => {
      setCopyTooltipText('Copy');
    }, 1000);
  };

  return (
    <Card {...other}>
      <CardHeader
        title='Invitations'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <Box
        sx={{
          m: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid item>
            <TextField
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchRoundedIcon fontSize='small' />
                  </InputAdornment>
                ),
              }}
              onChange={handleQueryChange}
              placeholder='Search invitations'
              size='small'
              value={query}
              variant='outlined'
            />
          </Grid>
          <Grid item>
            <TextField
              label='Sort By'
              name='sort'
              onChange={handleSortChange}
              select
              SelectProps={{ native: true }}
              size='small'
              value={sort}
              variant='outlined'
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              label='Invitation Status'
              name='invitationStatus'
              onChange={handleInvitationStatusChange}
              select
              SelectProps={{ native: true }}
              size='small'
              value={filters.invitationStatus || 'all'}
              variant='outlined'
            >
              {invitationStatusOptions.map((invitationStatusOption) => (
                <option
                  key={invitationStatusOption.value}
                  value={invitationStatusOption.value}
                >
                  {invitationStatusOption.label}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
        {orgInvitations.data.length > 0 && (
          <Scrollbar>
            <Box sx={{ minWidth: 800 }}>
              <EnhancedTableToolbar
                selectedInvitations={selectedInvitations}
                setSelectedInvitations={setSelectedInvitations}
                isSubmitting={isSubmitting}
                setSubmitting={setSubmitting}
              />
              <Table key='orgInvitationListTable'>
                <TableHead>
                  <TableRow
                    key='orgInvitationListTable'
                    sx={{
                      backgroundColor: theme.palette.background.tableHead,
                    }}
                  >
                    <TableCell padding='checkbox'>
                      <Checkbox
                        checked={selectedAllInvitations}
                        color='primary'
                        disabled={isSubmitting}
                        indeterminate={selectedSomeInvitations}
                        onChange={handleSelectAllInvitations}
                      />
                    </TableCell>
                    <TableCell>Invitation Code</TableCell>
                    <TableCell>E-Mail</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expires / Claimed</TableCell>
                    {user.user_role_grants &&
                    user.user_role_grants.includes('organization_write') ? (
                      <TableCell align='right' />
                    ) : (
                      <TableCell />
                    )}
                  </TableRow>
                </TableHead>
                {orgInvitations.data.length > 0 ? (
                  <TableBody>
                    {paginatedInvitations?.map((invitation) => {
                      const organizationInvitationUuid =
                        invitation.organization_invitation_uuid;
                      const invitationEmail = invitation.invitation_email;
                      const invitationCode = invitation.invitation_code;
                      const creatorUserUuid = invitation.creator_user_uuid; // TODO
                      const claimingUserUuid = invitation.claiming_user_uuid; // TODO
                      const invitationStatus =
                        invitation.organization_invitation_status_name;
                      const tsClaimed = invitation.ts_claimed;
                      const tsExpires = invitation.ts_expires;
                      const invitationExpired = invitation.invitation_expired;

                      const inviteTs = tsClaimed
                        ? tsClaimed
                        : tsExpires
                          ? tsExpires
                          : '';

                      const isInvitationSelected = selectedInvitations.includes(
                        organizationInvitationUuid,
                      );

                      return (
                        <TableRow
                          hover
                          key={organizationInvitationUuid}
                          selected={isInvitationSelected}
                          role='checkbox'
                          aria-checked={isInvitationSelected}
                          tabIndex={-1}
                          onClick={(event) =>
                            !isSubmitting &&
                            handleSelectOneInvitation(
                              event,
                              organizationInvitationUuid,
                            )
                          }
                        >
                          <TableCell
                            key={organizationInvitationUuid + '_cb'}
                            padding='checkbox'
                          >
                            <Checkbox
                              key={organizationInvitationUuid + '_cb'}
                              checked={isInvitationSelected}
                              disabled={isSubmitting}
                              color='primary'
                              onChange={(event) =>
                                handleSelectOneInvitation(
                                  event,
                                  organizationInvitationUuid,
                                )
                              }
                              value={isInvitationSelected}
                            />
                          </TableCell>
                          <TableCell>
                            {invitationExpired ||
                            invitationStatus === 'Invalidated' ||
                            invitationStatus === 'Claimed' ? null : (
                              <Box
                                key={organizationInvitationUuid + '_code'}
                                sx={{
                                  alignItems: 'center',
                                  display: 'flex',
                                }}
                              >
                                **********
                                <CopyToClipboard
                                  className='copy-icon'
                                  sx={{
                                    ml: 1,
                                  }}
                                  text={invitationCode}
                                  onCopy={() => {
                                    setCopiedKey(invitationCode);
                                    CopyTooltipText();
                                  }}
                                >
                                  <Tooltip
                                    title={copyTooltipText}
                                    placement='right'
                                    arrow
                                  >
                                    <ContentCopyOutlinedIcon
                                      color='primary'
                                      fontSize='small'
                                    />
                                  </Tooltip>
                                </CopyToClipboard>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>{invitationEmail}</TableCell>
                          <TableCell>
                            <Box
                              key={organizationInvitationUuid + '_status'}
                              sx={{
                                alignItems: 'center',
                                display: 'flex',
                                color: invitationExpired
                                  ? 'error.main'
                                  : 'inherit',
                              }}
                            >
                              {invitationStatus === 'Invalidated'
                                ? invitationStatus
                                : invitationExpired
                                  ? 'Expired'
                                  : invitationStatus}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={invitationExpired ? 'error' : 'inherit'}
                              sx={{
                                textTransform: 'capitalize',
                              }}
                              variant='body2'
                            >
                              {invitationStatus !== 'Invalidated' &&
                                dateTimeRelative(inviteTs)}
                            </Typography>
                          </TableCell>
                          {user.user_role_grants?.includes(
                            'organization_write',
                          ) &&
                          invitationStatus !== 'Invalidated' &&
                          selectedInvitations.length < 2 ? (
                            <TableCell align='right'>
                              <Tooltip arrow placement='top' title='Invalidate'>
                                <span>
                                  <IconButton
                                    color='primary'
                                    disabled={isSubmitting}
                                    key={
                                      organizationInvitationUuid + '_invalidate'
                                    }
                                    onClick={async () => {
                                      setSubmitting(true);
                                      const invalidatePayload = {};
                                      invalidatePayload['user'] = user;
                                      invalidatePayload['action'] =
                                        'invalidate';
                                      invalidatePayload['organization_uuid'] =
                                        user.organization_uuid;
                                      invalidatePayload[
                                        'organization_invitation_uuid'
                                      ] = organizationInvitationUuid;

                                      await InvalidateOrgInvitation(
                                        invalidatePayload,
                                        (response) => {
                                          if (
                                            !response ||
                                            response.status_code !== 200
                                          )
                                            throw new Error(
                                              'Invitation invalidation failed',
                                            );
                                        },
                                      )
                                        .then(() => {
                                          setSubmitting(false);
                                          dispatch(
                                            removeFromOrgInvitations(
                                              organizationInvitationUuid,
                                            ),
                                          );
                                          toast.success(
                                            'Invitation invalidated',
                                            { containerId: 'results' },
                                          );
                                        })
                                        .catch((err) => {
                                          setSubmitting(false);
                                          toast.error(err.message, {
                                            containerId: 'results',
                                          });
                                        });
                                    }}
                                  >
                                    <DeleteOutlinedIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              {invitationExpired ||
                              invitationStatus === 'Invalidated' ||
                              invitationStatus === 'Claimed' ? null : (
                                <Tooltip arrow placement='top' title='Resend'>
                                  <span>
                                    <IconButton
                                      color='primary'
                                      disabled={isSubmitting}
                                      key={
                                        organizationInvitationUuid + '_resend'
                                      }
                                      onClick={async () => {
                                        try {
                                          setSubmitting(true);
                                          const resendPayload = {};
                                          resendPayload['user'] = user;
                                          resendPayload['action'] = 'send';
                                          resendPayload[
                                            'organization_invitation_uuid'
                                          ] = organizationInvitationUuid;
                                          resendPayload['organization_uuid'] =
                                            user.organization_uuid;
                                          resendPayload['invitation_email'] =
                                            invitationEmail;
                                          resendPayload['invitation_code'] =
                                            invitationCode;

                                          await ResendOrgInvitation(
                                            resendPayload,
                                            (response) => {
                                              if (
                                                !response ||
                                                response.status_code !== 200
                                              )
                                                throw new Error(
                                                  'Invitation resend error',
                                                );
                                            },
                                          )
                                            .then(() => {
                                              toast.success(
                                                'Invitation resent',
                                                { containerId: 'results' },
                                              );
                                              setSubmitting(false);
                                            })
                                            .catch((err) => {
                                              throw err;
                                            });
                                        } catch (err) {
                                          setSubmitting(false);
                                          toast.error(err.message, {
                                            containerId: 'results',
                                          });
                                        }
                                      }}
                                    >
                                      <SendOutlinedIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                          ) : (
                            <TableCell>
                              <Box sx={{ py: 2.5, width: '80px' }} />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                ) : (
                  <TableBody />
                )}
              </Table>
              <TablePagination
                component='div'
                count={filteredInvitations.length}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={filteredInvitations.length === 0 ? 0 : page}
                rowsPerPage={limit}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </Box>
          </Scrollbar>
        )}
      </Box>
    </Card>
  );
};

/*
OrgInvitationListTable.propTypes = {
  orgInvitations: PropTypes.array.isRequired
};
*/

export default OrgInvitationListTable;
