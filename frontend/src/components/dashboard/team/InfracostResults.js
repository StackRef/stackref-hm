import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const InfracostResults = (props) => {
  const { results, tsCreated, ...other } = props;
  const theme = useTheme();

  return (
    <Card {...other}>
      <CardHeader
        title='Infracost&#8482; Breakdown'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
        }}
      />
      <CardContent>
        <Box></Box>
        <TableContainer>
          <Table>
            <caption>
              Costs calculated at time of analysis and applied only to IaC
              present in Team repository{' '}
              <i>(Last updated: {dateTimeRelative(tsCreated)})</i>
            </caption>
            <TableHead>
              <TableRow>
                <TableCell>Total Supported Resources</TableCell>
                <TableCell>Total Hourly Cost</TableCell>
                <TableCell>Total Monthly Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {results.summary?.totalSupportedResources?.toLocaleString() ||
                    '0'}{' '}
                  (of{' '}
                  {results.summary?.totalDetectedResources?.toLocaleString() ||
                    '0'}{' '}
                  detected)
                </TableCell>
                <TableCell>
                  ${results.totalHourlyCost?.toLocaleString() || '0.00'} USD
                </TableCell>
                <TableCell>
                  ${results.totalMonthlyCost?.toLocaleString() || '0.00'} USD
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default InfracostResults;
