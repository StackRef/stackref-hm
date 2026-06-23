import { format, subDays } from 'date-fns';
import numeral from 'numeral';
import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';

const transactions = [
  {
    id: 'd46800328cd510a668253b45',
    amount: 25,
    currency: 'sc',
    date: new Date(),
    sender: 'Jordan Avery',
    type: 'receive',
  },
  {
    id: 'b4b19b21656e44b487441c50',
    amount: 60,
    currency: 'sc',
    date: subDays(new Date(), 1),
    sender: 'Mike Lukaszevicz',
    type: 'send',
  },
];

const OverviewLatestPlaybooks = (props) => (
  <Card {...props}>
    <CardHeader title='Latest Playbooks' />
    <Table>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow
            key={transaction.id}
            sx={{
              '&:last-child td': {
                border: 0,
              },
            }}
          >
            <TableCell width={100}>
              <Box sx={{ p: 1 }}>
                <Typography
                  align='center'
                  color='textSecondary'
                  variant='subtitle2'
                >
                  {format(transaction.date, 'LLL').toUpperCase()}
                </Typography>
                <Typography align='center' color='textSecondary' variant='h6'>
                  {format(transaction.date, 'd')}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <div>
                <Typography color='textPrimary' variant='subtitle2'>
                  {transaction.sender}
                </Typography>
                <Typography color='textSecondary' variant='body2'>
                  {transaction.type === 'receive'
                    ? 'StackCoin earned'
                    : 'StackCoin spent'}
                </Typography>
              </div>
            </TableCell>
            <TableCell align='right'>
              <Typography
                color={
                  transaction.type === 'receive' ? 'success.main' : 'error.main'
                }
                variant='subtitle2'
              >
                {transaction.type === 'receive' ? '+' : '-'}{' '}
                {numeral(transaction.amount).format('$0,0.00')}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {transaction.currency.toUpperCase()}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

export default OverviewLatestPlaybooks;
