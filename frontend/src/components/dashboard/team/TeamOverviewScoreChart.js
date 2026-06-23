import Chart from 'react-apexcharts';
import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'src/store';

const TeamOverviewScoreChart = (props) => {
  const { eventTotalPoints, ...other } = props;
  const teamScoreItems = useSelector((state) => state.teamScoreItems);
  const theme = useTheme();

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
            size: '40%',
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
      !teamScoreItems?.data?.team_score_total || !eventTotalPoints
        ? 0
        : Number(
            Math.ceil(
              (teamScoreItems?.data?.team_score_total / eventTotalPoints) * 100,
            ),
          ),
    ],
  };

  return (
    <Card {...other}>
      <CardHeader
        title='Team Total Score'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          p: 1,
        }}
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Chart height='160' type='radialBar' width='160' {...chart} />
        <Box
          sx={{
            display: 'flex',
            flex: 1,
          }}
        >
          <div>
            <Typography color='textPrimary' variant='h4'>
              {teamScoreItems?.data?.team_score_total || '0'}
            </Typography>
            <Typography color='textPrimary' variant='subtitle2'>
              (of possible {eventTotalPoints || '0'})
            </Typography>
          </div>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeamOverviewScoreChart;
