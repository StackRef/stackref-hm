//import Chart from 'react-apexcharts';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useStackRef from 'src/hooks/useStackRef';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<CircularProgress />}>
    <Component {...props} />
  </Suspense>
);

const Chart = Loadable(lazy(() => import('react-apexcharts')));

const CashTransactionChart = (props) => {
  const theme = useTheme();
  const [sentTransactions, setSentTransactions] = useState([]);
  const [receivedTransactions, setReceivedTransactions] = useState([]);
  const { activeTeam } = useStackRef();

  console.log(':: CashTransactionChart');

  const { transactions, ...other } = props;

  useEffect(() => {
    setSentTransactions(
      transactions
        ?.slice()
        .reverse()
        .map(
          (transaction) =>
            (transaction.sending_entity_uuid === activeTeam?.team_uuid &&
              transaction.transaction_value) ||
            0,
        ),
    );
    setReceivedTransactions(
      transactions
        ?.slice()
        .reverse()
        .map(
          (transaction) =>
            (transaction.receiving_entity_uuid === activeTeam?.team_uuid &&
              transaction.transaction_value) ||
            0,
        ),
    );
  }, [activeTeam, transactions]);

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
          data: sentTransactions,
        },
        {
          name: 'Added',
          data: receivedTransactions,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentTransactions, receivedTransactions]);

  return (
    <Card
      {...other}
      sx={{
        backgroundColor: theme.palette.background.default,
        mt: 2,
      }}
    >
      <CardHeader
        title='Transaction Trend'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        {!transactions ? (
          <Skeleton>
            <Chart height='260' width='100%' type='area' {...chartData} />
          </Skeleton>
        ) : (
          <Chart height='260' width='100%' type='area' {...chartData} />
        )}
      </CardContent>
    </Card>
  );
};

export default CashTransactionChart;
