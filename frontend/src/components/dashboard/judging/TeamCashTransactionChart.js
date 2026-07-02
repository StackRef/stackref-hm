//import Chart from 'react-apexcharts';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from 'src/hooks/useAuth';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const Chart = Loadable(lazy(() => import('react-apexcharts')));

const TeamCashTransactionChart = (props) => {
  const { team, ...other } = props;
  const { user } = useAuth();
  const theme = useTheme();
  const [teamBankData, setTeamBankData] = useState();
  const [isLoading, setLoading] = useState(true);

  console.log(':: TeamCashTransactionChart');

  const getTeamTransactions = useCallback(async () => {
    if (team) {
      try {
        await GetCoinBalance(user, team.team_uuid)
          .then(async (data) => {
            if (data) {
              setTeamBankData(data);
            } else {
              setTeamBankData(null);
            }
            setLoading(false);
          })
          .catch((error) => {
            setTeamBankData(null);
            throw new Error(error);
          });
      } catch (error) {
        console.error(`>> getTeamTransactions: ${error}`);
      }
    }
  }, [team, user]);

  useEffect(() => {
    getTeamTransactions();
  }, [getTeamTransactions]);

  const sentTransactions = useMemo(() => {
    return teamBankData?.transactions
      ?.slice()
      .reverse()
      .map(
        (transaction) =>
          (transaction.sending_entity_uuid === team?.team_uuid &&
            transaction.transaction_value) ||
          0,
      );
  }, [team, teamBankData]);

  const receivedTransactions = useMemo(() => {
    return teamBankData?.transactions
      ?.slice()
      .reverse()
      .map(
        (transaction) =>
          (transaction.receiving_entity_uuid === team?.team_uuid &&
            transaction.transaction_value) ||
          0,
      );
  }, [team, teamBankData]);

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
        colors: ['#ffb547', '#7783DB'],
        dataLabels: {
          enabled: false,
        },
        fill: {
          type: 'solid',
          opacity: 0,
        },
        grid: {
          borderColor: theme.palette.divider,
        },
        markers: {
          strokeColors: theme.palette.background.paper,
          size: 6,
        },
        stroke: {
          curve: 'straight',
          width: 2,
        },
        theme: {
          mode: theme.palette.mode,
        },
        tooltip: {
          theme: theme.palette.mode,
        },
        xaxis: {
          axisBorder: {
            color: theme.palette.divider,
            show: true,
          },
          axisTicks: {
            color: theme.palette.divider,
            show: false,
          },
        },
      },
      series: [
        {
          name: 'Removed',
          data: sentTransactions || [],
        },
        {
          name: 'Added',
          data: receivedTransactions || [],
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentTransactions, receivedTransactions]);

  return (
    <Card {...other}>
      <CardHeader
        title='StackCash Activity'
        subheader={
          teamBankData?.bank_balance
            ? `Ending Balance: ${teamBankData.bank_balance}`
            : null
        }
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
          '& .MuiCardHeader-subheader': {
            color: theme.palette.common.white,
            fontSize: '0.9rem',
          },
        }}
      />
      <CardContent>
        {isLoading ? (
          <Skeleton>
            <Chart height='260' width='260' type='area' {...chartData} />
          </Skeleton>
        ) : (
          <Chart height='260' width='260' type='area' {...chartData} />
        )}
        {!isLoading && !teamBankData?.transactions ? (
          <Typography
            sx={{
              fontStyle: 'italic',
            }}
          >
            No transactions executed
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TeamCashTransactionChart;
