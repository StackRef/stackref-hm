import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import numeral from 'numeral';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import useAuth from 'src/hooks/useAuth';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const applyPagination = (orgTransactions, page, limit) =>
  orgTransactions?.slice(page * limit, page * limit + limit);

const OverviewLatestTransactions = (props) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMountedRef = useIsMountedRef();
  const [orgTransactions, setOrgTransactions] = useState();
  const [isLoading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
  };

  const paginatedTransactions = applyPagination(
    orgTransactions?.transactions,
    page,
    limit,
  );

  const getOrgTransactions = useCallback(async () => {
    console.log(':: getOrgTransactions');
    try {
      await GetCoinBalance(user, user.organization_uuid)
        .then((data) => {
          if (data) {
            setOrgTransactions(data);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    } catch (error) {
      console.error(`>> getOrgTransactions: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    async function initialize() {
      await getOrgTransactions();
      setLoading(false);
    }
    initialize();
  }, [getOrgTransactions]);

  return (
    <Card {...props}>
      <CardHeader
        title='Organization StackCash Transactions'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent>
        <Table>
          <TableBody>
            {isLoading ? (
              <TableRow key='skel_1'>
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
              paginatedTransactions?.map((transaction) => (
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
                      {dateTimeRelative(transaction.ts_modified)}
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
                      <Typography>
                        {transaction.transaction_details?.description}
                        {transaction.transaction_details?.marketplace_item_type
                          ? ' (' +
                            transaction.transaction_details
                              ?.marketplace_item_type +
                            ')'
                          : null}
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
                      {numeral(transaction.transaction_value).format('0,0.00')}
                    </Typography>
                    <Typography color='textSecondary' variant='body2'>
                      SC
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component='div'
          count={orgTransactions?.transactions?.length || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={orgTransactions?.transactions?.length === 0 ? 0 : page}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>
    </Card>
  );
};

export default OverviewLatestTransactions;
