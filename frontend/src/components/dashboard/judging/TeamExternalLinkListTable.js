import { useState } from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { useTheme } from '@mui/material/styles';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
];

function EnhancedTableHead(props) {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align='left'>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const TeamExternalLinkListTable = (props) => {
  const { team, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const [copiedKey, setCopiedKey] = useState();
  const [copyTooltipText, setCopyTooltipText] = useState('Copy');
  const theme = useTheme();

  const CopyTooltipText = () => {
    setCopyTooltipText('COPIED!');
    setTimeout(() => {
      setCopyTooltipText('Copy');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader
        title='External Links'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby='tableTitle'
            size='small'
          >
            <EnhancedTableHead />
            <TableBody>
              {team?.team_external_links ? (
                team?.team_external_links.map((teamExternalLink, index) => {
                  const ExternalLinkTypeIcon =
                    typeIcons[teamExternalLink.external_link_type_name] ||
                    BusinessCenterRoundedIcon;
                  if (!teamExternalLink.team_private) {
                    return (
                      <TableRow
                        key={teamExternalLink.team_external_link_uuid}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell component='th' scope='row'>
                          <Typography variant='body1'>
                            {teamExternalLink.team_external_link_name}
                          </Typography>
                        </TableCell>
                        <TableCell align='left'>
                          <Grid container spacing={1}>
                            <Grid item>
                              <ExternalLinkTypeIcon fontSize='small' />
                            </Grid>
                            <Grid item>
                              <Typography>
                                {teamExternalLink.external_link_type_name}
                              </Typography>
                            </Grid>
                          </Grid>
                        </TableCell>
                        <TableCell>
                          <Grid container spacing={1}>
                            <Grid item>
                              <CopyToClipboard
                                className='copy-icon'
                                sx={{
                                  ml: 1,
                                }}
                                text={teamExternalLink.team_external_link_url}
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
                                  href={teamExternalLink.team_external_link_url}
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
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              ) : (
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!team?.team_external_links ? (
          <Typography
            sx={{
              fontStyle: 'italic',
              mt: 2,
            }}
          >
            No external links provided
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TeamExternalLinkListTable;
