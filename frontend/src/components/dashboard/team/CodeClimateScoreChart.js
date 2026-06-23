import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const CodeClimateScoreChart = (props) => {
  const { results, tsCreated, ...other } = props;
  const theme = useTheme();
  const [totalRemediationPts, setTotalRemediationPts] = useState(0);
  const [totalFilesCovered, setTotalFilesCovered] = useState(0);

  useEffect(() => {
    results?.forEach((result) => {
      setTotalRemediationPts((prevPoints) =>
        result.remediation_points
          ? prevPoints + result.remediation_points
          : prevPoints,
      );
      setTotalFilesCovered((prevTotal) =>
        result.remediation_points ? prevTotal + 1 : prevTotal,
      );
    });
  }, [results]);

  const avgRemediationPts = useMemo(() => {
    return (
      parseFloat((totalRemediationPts / totalFilesCovered).toFixed(0)) || 0
    );
  }, [totalRemediationPts, totalFilesCovered]);

  // See: https://docs.codeclimate.com/docs/code-climate-glossary
  const avgScorePct = useMemo(() => {
    //return parseFloat((100 - (avgRemediationPts / 160000)).toFixed(0));
    return avgRemediationPts > 16000000
      ? 0
      : avgRemediationPts > 8000000
        ? 25
        : avgRemediationPts > 4000000
          ? 50
          : avgRemediationPts > 2000000
            ? 75
            : 100;
  }, [avgRemediationPts]);

  const chart = {
    options: {
      chart: {
        type: 'radialBar',
      },
      colors: [
        avgScorePct < 25
          ? '#F44336'
          : avgScorePct < 50
            ? '#FF9800'
            : avgScorePct < 75
              ? '#FFFF00'
              : avgScorePct < 100
                ? '#688EFF'
                : '#4CAF50',
      ],
      plotOptions: {
        radialBar: {
          hollow: {
            size: '70%',
            margin: 0,
            image: '/static/code-climate-logo.svg',
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
              fontSize: '30px',
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
      labels: [
        avgScorePct < 25
          ? 'F'
          : avgScorePct < 50
            ? 'D'
            : avgScorePct < 75
              ? 'C'
              : avgScorePct < 100
                ? 'B'
                : 'A',
      ],
    },
    series: [avgScorePct],
  };

  return (
    <Card {...other}>
      <CardHeader
        title='Code Climate&#8482; Score'
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
            Code Climate&#8482; score based on:
            <br />- Total remediation findings:{' '}
            {totalFilesCovered.toLocaleString()}
            <br />- Average "remediation points" for project:{' '}
            {avgRemediationPts.toLocaleString()}
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

export default CodeClimateScoreChart;
