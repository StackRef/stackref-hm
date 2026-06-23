import { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import useStackRef from 'src/hooks/useStackRef';
import { stackrefConfig } from 'src/config';

const TeamCodeCommitInfo = (props) => {
  const { ...other } = props;
  const theme = useTheme();
  const [copiedKey, setCopiedKey] = useState();
  const [copyTooltipText, setCopyTooltipText] = useState('Copy');
  const { activeTeam } = useStackRef();

  const CopyTooltipText = () => {
    setCopyTooltipText('COPIED!');
    setTimeout(() => {
      setCopyTooltipText('Copy');
    }, 1000);
  };

  console.log(':: TeamCodeCommitInfo');

  return !activeTeam?.codecommit_info ? null : (
    <Card {...other}>
      <CardHeader
        title='Code Analysis Git'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          p: 1,
        }}
      />
      <CardContent>
        <Box>
          <Typography variant='body2'>
            Use the below information to connect to your StackRef-provided Git
            repository. These credentials are shared amongst all of this team's
            members.
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Git URL</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Password</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                    }}
                  >
                    {`https://${
                      stackrefConfig.uiEnvironment === 'prod'
                        ? 'app'
                        : stackrefConfig.uiEnvironment
                    }.example.com/v1/repos/${activeTeam.team_uuid}`}
                    <CopyToClipboard
                      className='copy-icon'
                      sx={{
                        ml: 1,
                      }}
                      text={`https://${
                        stackrefConfig.uiEnvironment === 'prod'
                          ? 'app'
                          : stackrefConfig.uiEnvironment
                      }.example.com/v1/repos/${activeTeam.team_uuid}`}
                      onCopy={() => {
                        setCopiedKey(
                          `https://${
                            stackrefConfig.uiEnvironment === 'prod'
                              ? 'app'
                              : stackrefConfig.uiEnvironment
                          }.example.com/v1/repos/${activeTeam.team_uuid}`,
                        );
                        CopyTooltipText();
                      }}
                    >
                      <Tooltip title={copyTooltipText} placement='right' arrow>
                        <ContentCopyOutlinedIcon
                          color='primary'
                          fontSize='small'
                        />
                      </Tooltip>
                    </CopyToClipboard>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    borderLeft: '1px solid rgba(145, 158, 171, 0.24)',
                    borderRight: '1px solid rgba(145, 158, 171, 0.24)',
                  }}
                >
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                    }}
                  >
                    {activeTeam.codecommit_info.team_codecommit_user}
                    <CopyToClipboard
                      className='copy-icon'
                      sx={{
                        ml: 1,
                      }}
                      text={activeTeam.codecommit_info.team_codecommit_user}
                      onCopy={() => {
                        setCopiedKey(
                          activeTeam.codecommit_info.team_codecommit_user,
                        );
                        CopyTooltipText();
                      }}
                    >
                      <Tooltip title={copyTooltipText} placement='right' arrow>
                        <ContentCopyOutlinedIcon
                          color='primary'
                          fontSize='small'
                        />
                      </Tooltip>
                    </CopyToClipboard>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
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
                      text={activeTeam.codecommit_info.team_codecommit_password}
                      onCopy={() => {
                        setCopiedKey(
                          activeTeam.codecommit_info.team_codecommit_password,
                        );
                        CopyTooltipText();
                      }}
                    >
                      <Tooltip title={copyTooltipText} placement='right' arrow>
                        <ContentCopyOutlinedIcon
                          color='primary'
                          fontSize='small'
                        />
                      </Tooltip>
                    </CopyToClipboard>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant='body2' sx={{ mt: 2 }}>
          <i>
            This repository is used only for automated security scanning and
            scoring of source code. All data and credentials for this repository
            are deleted upon an event's conclusion.
          </i>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TeamCodeCommitInfo;
