import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import numeral from 'numeral';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';
import { dateTimeRelative } from 'src/utils/dtmFormatting';
//import StackCashRounded from 'src/icons/StackCashRounded';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<CircularProgress />}>
    <Component {...props} />
  </Suspense>
);

const Chart = lazy(() => import('react-apexcharts'));
const CashTransactionChart = Loadable(
  lazy(() => import('./CashTransactionChart')),
);

const OverviewTeamBankBalance = (props) => {
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [teamBankData, setTeamBankData] = useState();
  const { activeTeam, participant } = useStackRef();

  console.log(':: OverviewTeamBankBalance');

  const getTeamTransactions = useCallback(async () => {
    if (activeTeam) {
      try {
        await GetCoinBalance(user, activeTeam.team_uuid)
          .then(async (data) => {
            if (data) {
              setTeamBankData(data);
              setLoading(false);
            }
          })
          .catch((error) => {
            setTeamBankData(null);
            throw error;
          });
      } catch (error) {
        console.error(`>> getTeamTransactions: ${error}`);
      }
    }
  }, [activeTeam, user]);

  useEffect(() => {
    async function initialize() {
      await getTeamTransactions();
    }
    initialize();
  }, [getTeamTransactions]);

  const TrendIndicator = useCallback(() => {
    return teamBankData?.transactions?.[0]?.receiving_entity_uuid ===
      activeTeam?.team_uuid ? (
      <Tooltip
        title={
          'Upward Trend: +' + teamBankData?.transactions[0].transaction_value
        }
        arrow
      >
        <Avatar
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.08),
            color: 'success.main',
          }}
          variant='rounded'
        >
          <ExpandLessIcon fontSize='small' />
        </Avatar>
      </Tooltip>
    ) : teamBankData?.transactions?.[0] ? (
      <Tooltip
        title={
          'Downward Trend: -' + teamBankData.transactions[0].transaction_value
        }
        arrow
      >
        <Avatar
          sx={{
            backgroundColor: alpha(theme.palette.error.main, 0.08),
            color: 'error.main',
          }}
          variant='rounded'
        >
          <ExpandMoreIcon fontSize='small' />
        </Avatar>
      </Tooltip>
    ) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam, teamBankData]);

  const chartData = useMemo(() => {
    return {
      options: {
        chart: {
          background: 'inherit',
          stacked: false,
          toolbar: {
            show: false,
          },
          zoom: false,
        },
        colors: ['#27c6db'],
        labels: [''],
        plotOptions: {
          radialBar: {
            dataLabels: {
              value: {
                show: false,
              },
            },
            hollow: {
              size: '60%',
            },
            track: {
              background: theme.palette.background.default,
            },
          },
        },
        theme: {
          mode: theme.palette.mode,
        },
      },
      series: [
        100 - (teamBankData?.spent_cash / teamBankData?.received_cash) * 100 ||
          teamBankData?.received_cash ||
          0,
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamBankData]);

  return activeTeam ? (
    <Card {...props}>
      <CardHeader
        title='Team StackCash'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent
        sx={{
          alignItems: 'center',
        }}
      >
        <>
          <Grid container item xs={12}>
            {isLoading ? (
              <Skeleton
                variant='circular'
                height={100}
                sx={{
                  my: 2,
                  mx: 4,
                }}
                width={100}
              />
            ) : (
              <Chart height='160' type='radialBar' width='160' {...chartData} />
            )}
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                mt: 4,
              }}
            >
              <div>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='h3' sx={{ textAlign: 'center' }}>
                    {isLoading ? (
                      <Skeleton width={100} />
                    ) : (
                      (teamBankData?.bank_balance >= 0 &&
                        numeral(teamBankData.bank_balance).format('0,0.00')) ||
                      '0.00'
                    )}
                  </Typography>
                </Box>
                <Typography
                  color='textPrimary'
                  sx={{ mt: 1 }}
                  variant='subtitle2'
                >
                  Your Team's StackCash
                </Typography>
              </div>
              <Box sx={{ flexGrow: 1 }} />
              <TrendIndicator />
            </Box>
          </Grid>
          <Grid container item xs={12}>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Table size='small'>
                <caption>
                  {!teamBankData?.transactions && 'No '}Recent Transactions
                </caption>
                <TableHead
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '& th': {
                      color: theme.palette.background.paper,
                      fontWeight: 'bold',
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Spent</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading && (
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
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  )}
                  {teamBankData?.transactions
                    ?.slice(0, 5)
                    ?.map((transaction) => (
                      <TableRow
                        key={transaction.transaction_uuid}
                        sx={{
                          '&:last-child td': {
                            border: 0,
                          },
                        }}
                      >
                        <TableCell>
                          {transaction.transaction_details?.description}
                        </TableCell>
                        <TableCell>
                          {transaction.receiving_entity_uuid ===
                            participant?.participant_teams?.[0]?.team_uuid &&
                            '+' + transaction.transaction_value}
                        </TableCell>
                        <TableCell>
                          {transaction.receiving_entity_uuid !==
                            participant?.participant_teams?.[0]?.team_uuid &&
                            '-' + transaction.transaction_value}
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              textTransform: 'capitalize',
                            }}
                            variant='body2'
                          >
                            {dateTimeRelative(transaction.ts_modified)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          {teamBankData?.transactions ? (
            <CashTransactionChart transactions={teamBankData.transactions} />
          ) : null}
        </>
      </CardContent>
    </Card>
  ) : null;
};

export default OverviewTeamBankBalance;
