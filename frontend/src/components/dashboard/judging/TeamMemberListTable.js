import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import {
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import GetTeamMembers from 'src/components/stackref/GetTeamMembers';
import useAuth from 'src/hooks/useAuth';

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
];

function EnhancedTableHead(props) {
  return (
    <TableHead>
      <TableRow>
        <TableCell component='th' />
        {headCells.map((headCell) => (
          <TableCell
            component='th'
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const TeamMemberListTable = (props) => {
  const { team, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const theme = useTheme();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState();

  const getTeamMembers = useCallback(async () => {
    console.log(':: getTeamMembers');
    if (team) {
      try {
        await GetTeamMembers(user, team.team_uuid)
          .then((data) => {
            try {
              setTeamMembers(data);
              setLoading(false);
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> getTeamMembers: ${err}`);
        setTeamMembers(null);
      }
    }
  }, [team, user]);

  useEffect(() => {
    getTeamMembers();
  }, [getTeamMembers]);

  return (
    <Card>
      <CardHeader
        title='Team Members'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <TableContainer>
          <Table aria-labelledby='tableTitle' size={'small'}>
            <EnhancedTableHead />
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers?.map((row, index) => {
                  return (
                    <TableRow
                      key={row.team_member_uuid}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
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
                      <TableCell scope='row' padding='normal'>
                        {row.first_name}
                      </TableCell>
                      <TableCell align='left'>{row.last_name}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
