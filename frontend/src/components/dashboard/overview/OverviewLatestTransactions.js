import { useCallback, useEffect, useState } from 'react';
import { formatRelative, isValid, parse } from 'date-fns';
import numeral from 'numeral';
import {
  Box,
  Card,
  CardHeader,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import useAuth from 'src/hooks/useAuth';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';

const DateTimeRelative = (props) => {
  const { user } = useAuth();
  let dateTime;
  let dateRef = new Date();

  if (props.dateTime) {
    // From DB: 2022-02-11 01:48:11
    // Tack on the 'Z' to tell the app we store UTC
    const utcTime = `${props.dateTime}Z`;
    if (user.settings?.timezone)
      dateRef = new Date(
        new Date().toLocaleString('en-US', {
          timeZone: user.settings.timezone,
        }),
      );
    dateTime = parse(utcTime, "yyyy-MM-dd' 'HH:mm:ssX", dateRef);
  }

  return (
    <Typography
      variant='inherit'
      sx={{
        textTransform: 'capitalize',
      }}
    >
      {isValid(dateTime) ? formatRelative(dateTime, dateRef) : props.dateTime}
    </Typography>
  );
};

const OverviewLatestTransactions = (props) => {
  const { logout, user } = useAuth();
  const isMountedRef = useIsMountedRef();
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
          throw error;
        });
    } catch (error) {
      console.error(`>> getOrgCoinBalance: ${error}`);
    }
  }, [isMountedRef]);

  useEffect(() => {
    async function initialize() {
      await getOrgCoinBalance();
      setLoading(false);
    }
    initialize();
  }, [getOrgCoinBalance]);

  return (
    <Card {...props}>
      <CardHeader title='Latest Organization Transactions' />
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableBody>
            {orgCoinBalance?.transactions?.map((transaction) => (
              <TableRow
                key={transaction.transaction_uuid}
                sx={{
                  '&:last-child td': {
                    border: 0,
                  },
                }}
              >
                <TableCell width={100}>
                  <Box sx={{ p: 1 }}>
                    <DateTimeRelative dateTime={transaction.ts_modified} />
                  </Box>
                </TableCell>
                <TableCell>
                  <div>
                    <Typography color='textPrimary' variant='subtitle2'>
                      {transaction.receiving_entity_uuid ===
                      user.organization_uuid
                        ? 'StackCash received'
                        : 'StackCash sent'}
                    </Typography>
                    <Typography color='textSecondary' variant='body2'>
                      Transaction ID: {transaction.transaction_uuid}
                    </Typography>
                  </div>
                </TableCell>
                <TableCell align='right'>
                  <Typography
                    color={
                      transaction.receiving_entity_uuid ===
                      user.organization_uuid
                        ? 'success.main'
                        : 'error.main'
                    }
                    variant='subtitle2'
                  >
                    {transaction.receiving_entity_uuid ===
                    user.organization_uuid
                      ? '+'
                      : '-'}{' '}
                    {numeral(transaction.transaction_value).format('$0,0.00')}
                  </Typography>
                  <Typography color='textSecondary' variant='body2'>
                    SRC
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default OverviewLatestTransactions;
