import { useCallback, useEffect, useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Checkbox,
  Chip,
  FormHelperText,
  Grid,
  IconButton,
  Link,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useConfirm } from 'material-ui-confirm';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Field, Formik } from 'formik';
import { TextField as MUITextField } from 'formik-mui';
import * as Yup from 'yup';
import TeamEdit from 'src/components/dashboard/admin/TeamEdit';

import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';

// type icons
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded';
import CoPresentRoundedIcon from '@mui/icons-material/CoPresentRounded';
import OndemandVideoRoundedIcon from '@mui/icons-material/OndemandVideoRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';

const typeIcons = {
  Meeting: BusinessCenterRoundedIcon,
  SCM: InsertChartRoundedIcon,
  Other: QuestionMarkRoundedIcon,
  Presentation: CoPresentRoundedIcon,
  Video: OndemandVideoRoundedIcon,
  Documentation: ArticleRoundedIcon,
  'Spotify Playlist': QueueMusicRoundedIcon,
};

// TODO: Get these from a call to the API to pull from the DB
const externalLinkTypes = [
  {
    external_link_type_id: 1,
    external_link_type_name: 'Other',
  },
  {
    external_link_type_id: 2,
    external_link_type_name: 'SCM',
  },
  {
    external_link_type_id: 3,
    external_link_type_name: 'Presentation',
  },
  {
    external_link_type_id: 4,
    external_link_type_name: 'Meeting',
  },
  {
    external_link_type_id: 67,
    external_link_type_name: 'Video',
  },
  {
    external_link_type_id: 68,
    external_link_type_name: 'Documentation',
  },
  {
    external_link_type_id: 69,
    external_link_type_name: 'Spotify Playlist',
  },
];

const headCells = [
  {
    id: 'link_name',
    label: 'Name',
  },
  {
    id: 'link_type',
    label: 'Type',
  },
  {
    id: 'link_url',
    label: 'URL',
  },
  {
    id: 'private',
    label: 'Team Private',
  },
  {
    id: 'actions',
    label: '',
  },
];

function EnhancedTableHead(props) {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align='left'>
            {headCell.id === 'private' && (
              <Tooltip
                placement='top'
                title='Links marked private are viewable only by your team and not available for judging'
              >
                <HelpIcon fontSize='small' />
              </Tooltip>
            )}
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const TeamExternalLinkListTable = (props) => {
  const { ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState();
  const [copyTooltipText, setCopyTooltipText] = useState('Copy');
  const [externalLinkUuid, setExternalLinkUuid] = useState('');
  const [externalLinkName, setExternalLinkName] = useState('');
  const [externalLinkType, setExternalLinkType] = useState(1);
  const [externalLinkUrl, setExternalLinkUrl] = useState('');
  const [externalLinkPrivate, setExternalLinkPrivate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();
  const theme = useTheme();
  const { activeOrgEvent, activeTeam, activeTeamMember, setActiveTeam } =
    useStackRef();

  useEffect(() => {
    if (isDeleting && externalLinkUuid && externalLinkName) {
      confirm({
        title: 'Delete link?',
        confirmationText: 'OK',
        content: `This will delete link '${externalLinkName}'`,
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
          handleSubmitForm('delete_external_link');
          setIsDeleting(false);
        })
        .catch((err) => {
          console.error(`>> ${err}`);
          setIsDeleting(false);
          EditMode(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm, externalLinkUuid, externalLinkName, isDeleting]);

  const handleDeleteLinkClick = async (teamExternalLink) => {
    console.log(':: handleDeleteLinkClick');

    setExternalLinkUuid(teamExternalLink?.team_external_link_uuid);
    setExternalLinkName(teamExternalLink?.team_external_link_name);
    setIsDeleting(true);
  };

  const CopyTooltipText = () => {
    setCopyTooltipText('COPIED!');
    setTimeout(() => {
      setCopyTooltipText('Copy');
    }, 1000);
  };

  const EditMode = (teamExternalLink) => {
    console.log(':: EditMode');

    setExternalLinkUuid(teamExternalLink?.team_external_link_uuid || null);
    setExternalLinkName(teamExternalLink?.team_external_link_name || '');
    setExternalLinkUrl(teamExternalLink?.team_external_link_url || '');
    setExternalLinkType(
      externalLinkTypes?.find(
        (el) =>
          el.external_link_type_name ===
          teamExternalLink?.external_link_type_name,
      )?.external_link_type_id || 1,
    );
    setExternalLinkPrivate(teamExternalLink?.team_private || false);
    setEditMode(teamExternalLink?.team_external_link_uuid || null);
    setAddMode(false);
  };

  const handleExternalLinkNameChange = (event) => {
    setExternalLinkName(event.target.value);
  };

  const handleExternalLinkTypeChange = (event) => {
    setExternalLinkType(event.target.value);
  };

  const handleExternalLinkUrlChange = (event) => {
    setExternalLinkUrl(event.target.value);
  };

  const handleExternalLinkPrivateChange = (event) => {
    setExternalLinkPrivate((value) => !value);
  };

  const handleNewLinkClick = (event) => {
    setAddMode(true);
  };

  const handleSubmitForm = useCallback(
    async (action) => {
      try {
        const payload = {};
        if (isMountedRef.current) {
          setSubmitting(true);
          payload['user'] = user;
          payload['action'] = action;
          payload['event_uuid'] = activeTeam.event_uuid;
          payload['team_uuid'] = activeTeam.team_uuid;
          payload['team_private'] = externalLinkPrivate ? 'true' : 'false';
          payload['external_link_uuid'] = externalLinkUuid;
          payload['external_link_name'] = externalLinkName;
          payload['external_link_type_id'] = externalLinkType;
          payload['external_link_url'] = externalLinkUrl;

          await TeamEdit(payload, (response) => {
            if (!response || response.status_code !== 200)
              throw new Error('Link action failed');
          })
            .then(async () => {
              await setActiveTeam();
              setSubmitting(false);
              toast.success('Links updated', { containerId: 'results' });
              EditMode(false);
            })
            .catch((err) => {
              throw err;
            });
        }
      } catch (err) {
        console.error(`>> handleSubmitForm: ${err}`);
        if (isMountedRef.current) {
          setSubmitting(false);
          EditMode(false);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      isMountedRef,
      user,
      activeTeam,
      externalLinkPrivate,
      externalLinkUuid,
      externalLinkName,
      externalLinkType,
      externalLinkUrl,
      setActiveTeam,
    ],
  );

  return (
    <Card>
      <CardHeader
        title='External Links'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          p: 1,
        }}
      />
      <CardContent>
        <Formik
          initialValues={{
            teamExternalLinkName: '',
            teamExternalLinkUrl: '',
            teamExternalLinkPrivate: 'true',
            submit: null,
          }}
          validationSchema={Yup.object().shape({
            teamExternalLinkName: Yup.string()
              .max(100)
              .required('A valid link name is required')
              .typeError('You must specify a valid link name'),
            teamExternalLinkUrl: Yup.string()
              .max(100)
              .required('A valid link URL is required')
              .typeError('You must specify a valid link URL'),
          })}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {({ errors, handleBlur, resetForm, touched }) => (
            <form noValidate {...other}>
              <TableContainer>
                <Table
                  sx={{ minWidth: 750 }}
                  aria-labelledby='tableTitle'
                  size='small'
                >
                  <EnhancedTableHead />
                  <TableBody>
                    {activeTeam?.team_external_links?.map(
                      (teamExternalLink, index) => {
                        const ExternalLinkTypeIcon =
                          typeIcons[
                            teamExternalLink?.external_link_type_name
                          ] || BusinessCenterRoundedIcon;
                        return (
                          <TableRow
                            key={teamExternalLink.team_external_link_uuid}
                          >
                            <TableCell component='th' scope='row'>
                              {editMode ===
                              teamExternalLink.team_external_link_uuid ? (
                                <Field
                                  component={MUITextField}
                                  InputLabelProps={{ shrink: true }}
                                  error={Boolean(
                                    touched.teamExternalLinkName &&
                                      errors.teamExternalLinkName,
                                  )}
                                  fullWidth
                                  helperText={
                                    touched.teamExternalLinkName &&
                                    errors.teamExternalLinkName
                                  }
                                  value={externalLinkName}
                                  label='Name'
                                  margin='normal'
                                  name='teamExternalLinkName'
                                  onBlur={handleBlur}
                                  onChange={handleExternalLinkNameChange}
                                  variant='outlined'
                                  size='small'
                                  sx={{
                                    input: { color: 'text.primary' },
                                  }}
                                />
                              ) : (
                                <Typography variant='body1'>
                                  {teamExternalLink.team_external_link_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align='left'>
                              {editMode ===
                              teamExternalLink.team_external_link_uuid ? (
                                <TextField
                                  InputLabelProps={{ shrink: true }}
                                  size='small'
                                  select
                                  id='external-link-type'
                                  label='Type'
                                  value={externalLinkType}
                                  onChange={handleExternalLinkTypeChange}
                                  input={<OutlinedInput />}
                                  sx={{
                                    mt: 2,
                                  }}
                                >
                                  {externalLinkTypes.map((eLinkType) => {
                                    return (
                                      <MenuItem
                                        key={
                                          eLinkType.external_link_type_id +
                                          '_dialog'
                                        }
                                        label={
                                          eLinkType.external_link_type_name
                                        }
                                        value={eLinkType.external_link_type_id}
                                        autoFocus={
                                          externalLinkType ===
                                          eLinkType.external_link_type_id
                                        }
                                        size='small'
                                      >
                                        <ListItemText
                                          primary={
                                            eLinkType.external_link_type_name
                                          }
                                          primaryTypographyProps={{
                                            fontSize: '12px',
                                          }}
                                        />
                                      </MenuItem>
                                    );
                                  })}
                                </TextField>
                              ) : (
                                <Box display='flex' alignItems='center'>
                                  <ExternalLinkTypeIcon fontSize='small' />
                                  <Typography sx={{ ml: 1 }}>
                                    {teamExternalLink.external_link_type_name}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              {editMode ===
                              teamExternalLink.team_external_link_uuid ? (
                                <Field
                                  component={MUITextField}
                                  InputLabelProps={{ shrink: true }}
                                  error={Boolean(
                                    touched.teamExternalLinkUrl &&
                                      errors.teamExternalLinkUrl,
                                  )}
                                  fullWidth
                                  helperText={
                                    touched.teamExternalLinkUrl &&
                                    errors.teamExternalLinkUrl
                                  }
                                  label='URL'
                                  placeholder='https://'
                                  margin='normal'
                                  name='teamExternalLinkUrl'
                                  value={externalLinkUrl}
                                  onBlur={handleBlur}
                                  onChange={handleExternalLinkUrlChange}
                                  variant='outlined'
                                  size='small'
                                  sx={{
                                    input: { color: 'text.primary' },
                                  }}
                                />
                              ) : (
                                <Grid container spacing={1}>
                                  <Grid item>
                                    <CopyToClipboard
                                      className='copy-icon'
                                      sx={{
                                        ml: 1,
                                      }}
                                      text={
                                        teamExternalLink.team_external_link_url
                                      }
                                      onCopy={() => {
                                        setCopiedKey(
                                          teamExternalLink.team_external_link_url,
                                        );
                                        CopyTooltipText();
                                      }}
                                    >
                                      <Tooltip
                                        title={copyTooltipText}
                                        placement='top'
                                        arrow
                                      >
                                        <ContentCopyIcon
                                          color='primary'
                                          fontSize='small'
                                        />
                                      </Tooltip>
                                    </CopyToClipboard>
                                  </Grid>
                                  <Grid item>
                                    <Tooltip title='Open' placement='top' arrow>
                                      <Link
                                        href={
                                          teamExternalLink.team_external_link_url
                                        }
                                        underline='none'
                                        target='_blank'
                                        rel='noopener'
                                      >
                                        <OpenInNewIcon fontSize='small' />
                                      </Link>
                                    </Tooltip>
                                  </Grid>
                                  <Grid item>
                                    <Typography variant='caption'>
                                      {teamExternalLink.team_external_link_url}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              )}
                            </TableCell>
                            <TableCell>
                              {editMode ===
                              teamExternalLink.team_external_link_uuid ? (
                                <Checkbox
                                  label='Private?'
                                  name='TeamExternalLinkPrivate'
                                  onChange={handleExternalLinkPrivateChange}
                                  checked={externalLinkPrivate}
                                  size='small'
                                />
                              ) : (
                                <Checkbox
                                  checked={teamExternalLink.team_private}
                                  disabled
                                  size='small'
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {editMode ===
                                teamExternalLink.team_external_link_uuid &&
                              activeTeamMember?.team_member_roles?.length >
                                0 ? (
                                <>
                                  <Tooltip title='Save' placement='top' arrow>
                                    <IconButton
                                      color='primary'
                                      disabled={isSubmitting}
                                      onClick={async () => {
                                        setSubmitting(true);
                                        await handleSubmitForm(
                                          'update_external_link',
                                        );
                                        EditMode(false);
                                      }}
                                    >
                                      <CheckCircleIcon fontSize='small' />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title='Cancel' placement='top' arrow>
                                    <IconButton
                                      color='secondary'
                                      disabled={isSubmitting}
                                      onClick={() => {
                                        setSubmitting(false);
                                        EditMode(false);
                                        resetForm();
                                      }}
                                    >
                                      <CancelIcon fontSize='small' />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                !editMode &&
                                activeOrgEvent?.event_status_name ===
                                  'Running' &&
                                activeTeamMember?.team_member_roles?.length >
                                  0 && (
                                  <>
                                    <Tooltip title='Edit' placement='top' arrow>
                                      <span>
                                        <IconButton
                                          color='primary'
                                          disabled={isSubmitting}
                                          onClick={() => {
                                            EditMode(teamExternalLink);
                                          }}
                                        >
                                          <EditIcon fontSize='small' />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip
                                      title='Delete'
                                      placement='top'
                                      arrow
                                    >
                                      <span>
                                        <IconButton
                                          color='primary'
                                          disabled={isSubmitting}
                                          onClick={() => {
                                            handleDeleteLinkClick(
                                              teamExternalLink,
                                            );
                                          }}
                                        >
                                          <DeleteIcon fontSize='small' />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                    {user.user_role_grants &&
                    activeOrgEvent?.event_status_name === 'Running' &&
                    activeTeamMember?.team_member_roles?.length > 0 &&
                    !editMode &&
                    !isSubmitting &&
                    addMode ? (
                      <TableRow>
                        <TableCell>
                          <Field
                            component={MUITextField}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(
                              touched.teamExternalLinkName &&
                                errors.teamExternalLinkName,
                            )}
                            fullWidth
                            helperText={
                              touched.teamExternalLinkName &&
                              errors.teamExternalLinkName
                            }
                            label='Name'
                            margin='normal'
                            name='teamExternalLinkName'
                            onBlur={handleBlur}
                            value={externalLinkName}
                            onChange={handleExternalLinkNameChange}
                            variant='outlined'
                            size='small'
                            sx={{
                              input: { color: 'text.primary' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            InputLabelProps={{ shrink: true }}
                            size='small'
                            select
                            id='external-link-type'
                            label='Type'
                            value={externalLinkType}
                            onChange={handleExternalLinkTypeChange}
                            input={<OutlinedInput />}
                            sx={{
                              mt: 2,
                            }}
                          >
                            {externalLinkTypes.map((externalLinkType) => {
                              return (
                                <MenuItem
                                  key={
                                    externalLinkType.external_link_type_id +
                                    '_dialog'
                                  }
                                  label={
                                    externalLinkType.external_link_type_name
                                  }
                                  value={externalLinkType.external_link_type_id}
                                  size='small'
                                >
                                  <ListItemText
                                    primary={
                                      externalLinkType.external_link_type_name
                                    }
                                    primaryTypographyProps={{
                                      fontSize: '12px',
                                    }}
                                  />
                                </MenuItem>
                              );
                            })}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <Field
                            component={MUITextField}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(
                              touched.teamExternalLinkUrl &&
                                errors.teamExternalLinkUrl,
                            )}
                            fullWidth
                            helperText={
                              touched.teamExternalLinkUrl &&
                              errors.teamExternalLinkUrl
                            }
                            label='URL'
                            placeholder='https://'
                            margin='normal'
                            name='teamExternalLinkUrl'
                            onBlur={handleBlur}
                            value={externalLinkUrl}
                            onChange={handleExternalLinkUrlChange}
                            variant='outlined'
                            size='small'
                            sx={{
                              input: { color: 'text.primary' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            label='Private'
                            checked={externalLinkPrivate}
                            name='TeamExternalLinkPrivate'
                            onChange={handleExternalLinkPrivateChange}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title='Submit' placement='top' arrow>
                            <IconButton
                              color='primary'
                              disabled={isSubmitting}
                              onClick={() => {
                                handleSubmitForm('add_external_link');
                              }}
                            >
                              <CheckCircleIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Cancel' placement='top' arrow>
                            <IconButton
                              color='secondary'
                              disabled={isSubmitting}
                              onClick={() => {
                                EditMode(false);
                                setAddMode(false);
                              }}
                            >
                              <CancelIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell colSpan={5}>
                          {activeTeamMember?.team_member_roles?.length > 0 &&
                            activeOrgEvent?.event_status_name === 'Running' && (
                              <Button
                                onClick={handleNewLinkClick}
                                color='primary'
                                startIcon={<AddIcon fontSize='small' />}
                                sx={{ m: 1 }}
                                variant='contained'
                              >
                                Add New
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', mt: 2, justifyContent: 'center' }}>
                {errors.submit && (
                  <Chip
                    label={
                      <FormHelperText error>{errors.submit}</FormHelperText>
                    }
                  />
                )}
              </Box>
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default TeamExternalLinkListTable;
