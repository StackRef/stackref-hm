import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const SnykScoreChart = (props) => {
  const { results, tsCreated, ...other } = props;
  const theme = useTheme();
  const [totalScore, setTotalScore] = useState(0);
  const [totalFilesCovered, setTotalFilesCovered] = useState(0);

  useEffect(() => {
    results?.runs?.forEach((run) => {
      run.results.forEach((result) => {
        setTotalScore(
          (prevTotalScore) => prevTotalScore + result.properties?.priorityScore,
        );
      });
      run.properties?.coverage.forEach((item) => {
        setTotalFilesCovered(
          (prevTotalFilesCovered) =>
            item.isSupported && prevTotalFilesCovered + item.files,
        );
      });
    });
  }, [results]);

  const totalScorePct = useMemo(
    () =>
      (
        (totalFilesCovered * 1000 - totalScore) /
        (totalFilesCovered * 10)
      ).toFixed(),
    [totalFilesCovered, totalScore],
  );

  const chart = {
    options: {
      chart: {
        type: 'radialBar',
      },
      colors: [
        totalScorePct < 50
          ? '#F44336'
          : totalScorePct < 75
            ? '#FFFF00'
            : '#4CAF50',
      ],
      plotOptions: {
        radialBar: {
          hollow: {
            size: '70%',
            margin: 0,
            image: '/static/snyk-logo.png',
            imageWidth: 150,
            imageHeight: 150,
            imageClipped: false,
          },
          track: {
            dropShadow: {
              enabled: true,
              top: 2,
              left: 0,
              blur: 4,
              opacity: 0.15,
            },
          },
          dataLabels: {
            name: {
              offsetY: 85,
              fontSize: '25px',
            },
            value: {
              show: false,
            },
          },
        },
      },
      stroke: {
        lineCap: 'round',
      },
      labels: [totalScorePct + '%'],
    },
    series: [totalScorePct],
  };

  return (
    <Card {...other}>
      <CardHeader
        title='Snyk&#8482; Score'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          p: 1,
        }}
      />
      <CardContent
        sx={{
          alignItems: 'center',
        }}
      >
        <Box>
          <Chart type='radialBar' {...chart} />
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant='subtitle2'>
            Snyk&#8482; score based on:
            <br />- Total supported files: {totalFilesCovered.toLocaleString()}
            <br />- Total "priority score" (max 1000/file):{' '}
            {totalScore.toLocaleString()}
            <br />
          </Typography>
          <Typography
            variant='caption'
            sx={{ display: 'block', fontStyle: 'italic', mt: 2 }}
          >
            (Last updated: {dateTimeRelative(tsCreated)})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SnykScoreChart;
