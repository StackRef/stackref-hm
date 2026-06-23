import { useCallback, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import numeral from 'numeral';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import useIsMountedRef from 'use-is-mounted-ref';
import { alpha, useTheme } from '@mui/material/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import useAuth from 'src/hooks/useAuth';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';

const OverviewOrgBalance = (props) => {
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const { logout, user } = useAuth();
  const [orgCoinBalance, setOrgCoinBalance] = useState({ balance_value: 0 });
  const [isLoading, setLoading] = useState(true);

  const getOrgCoinBalance = useCallback(async () => {
    console.log(':: getOrgCoinBalance');
    try {
      await GetCoinBalance(user, user.organization_uuid)
        .then((data) => {
          if (data?.length > 0) setOrgCoinBalance(data[0]);
        })
        .catch((error) => {
          console.error('>> GetCoinBalance: ', error);
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getOrgCoinBalance: ${error}`);
      if (error.cause === 401) await logout();
    }
  }, [isMountedRef]);

  useEffect(() => {
    async function initialize() {
      if (user.user_role_grants?.includes('bank_read')) {
        await getOrgCoinBalance();
      }
      setLoading(false);
    }
    initialize();
  }, [getOrgCoinBalance, user]);

  const chart = {
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
    series: [23],
  };

  return !user.user_role_grants?.includes('bank_read') ? null : (
    <Card {...props}>
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Chart height='160' type='radialBar' width='160' {...chart} />
        {isLoading ? (
          <CircularProgress />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flex: 1,
            }}
          >
            <div>
              <Typography color='textPrimary' variant='h4'>
                {'SC '}
                {orgCoinBalance &&
                  numeral(orgCoinBalance.balance_value).format('0,0.00')}
              </Typography>
              <Typography
                color='textPrimary'
                sx={{ mt: 1 }}
                variant='subtitle2'
              >
                Your Organization's StackCash
              </Typography>
            </div>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title='Upward Trend' arrow>
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
          </Box>
        )}
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          color='primary'
          endIcon={<ChevronRightIcon fontSize='small' />}
          variant='text'
        >
          Transfer
        </Button>
      </CardActions>
    </Card>
  );
};

export default OverviewOrgBalance;
