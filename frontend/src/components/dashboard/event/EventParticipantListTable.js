import { useEffect, useState } from 'react';
import useStackRef from 'src/hooks/useStackRef';
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import SubdirectoryArrowRightRoundedIcon from '@mui/icons-material/SubdirectoryArrowRightRounded';
import Gravatar from 'src/icons/Gravatar';

const participantRoleIcons = {
  Spectator: VisibilityOutlinedIcon,
  Player: AccountCircleOutlinedIcon,
  SME: VerifiedOutlinedIcon,
  Judge: GavelOutlinedIcon,
  Manager: StarsOutlinedIcon,
  'Free Agent': ContactPageOutlinedIcon,
};

const EventParticipantListTable = (props) => {
  const { thisEvent, ...other } = props;
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const { participants, initializeParticipants } = useStackRef();

  useEffect(() => {
    async function initialize() {
      !!!participants && setLoading(true);
      await initializeParticipants(thisEvent?.event_uuid);
      setLoading(false);
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisEvent, initializeParticipants]);

  return !participants ? (
    <Typography {...other}>
      There are no participants added to this event
    </Typography>
  ) : (
    thisEvent?.participant_roles.map((row, index) => {
      const ParticipantRoleIcon =
        participantRoleIcons[row.participant_role_name];
      return (
        <TableContainer key={row.participant_role_id + '_tc'} {...other}>
          <Table
            aria-labelledby='tableTitle'
            //size='small'
            key={row.participant_role_id + '_table'}
          >
            <TableHead key={row.participant_role_id + '_th'}>
              <TableRow>
                <TableCell
                  colSpan={2}
                  sx={{
                    borderBottom: 'none',
                    display: 'flex',
                    fontWeight: 'bold',
                    width: '100%',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.tableHead,
                      display: 'flex',
                      p: 1,
                      width: '100%',
                    }}
                  >
                    <ParticipantRoleIcon size='small' sx={{ mr: 1 }} />
                    {row.participant_role_name}s
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody key={row.participant_role_id + '_tablebody'}>
              {!!!participants ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ) : (
                participants?.map((participant, index) => {
                  return (
                    participant.participant_roles?.some(
                      (d) =>
                        d.participant_role_name === row.participant_role_name,
                    ) && (
                      <TableRow key={participant.email_address}>
                        <TableCell
                          colSpan={2}
                          key='name'
                          sx={{
                            borderBottom: 'none',
                            display: 'flex',
                            width: '100%',
                          }}
                        >
                          <Box sx={{ display: 'flex', ml: 4, width: '100%' }}>
                            <Gravatar
                              emailAddress={participant.email_address}
                              fullName={
                                participant.first_name +
                                ' ' +
                                participant.last_name
                              }
                              size={24}
                              sx={{
                                height: 24,
                                mr: 2,
                                width: 24,
                              }}
                            />
                            {participant.first_name +
                              ' ' +
                              participant.last_name}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      );
    })
  );
};

/*
TeamMemberListTable.propTypes = {
  teamMembers: PropTypes.array.isRequired
};
*/

export default EventParticipantListTable;
