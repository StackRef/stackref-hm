import { useEffect, useState } from 'react';
import {
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

const SccResults = (props) => {
  const { results, tsCreated, ...other } = props;
  const theme = useTheme();
  const [totalCount, setTotalCount] = useState(0);
  const [totalBlank, setTotalBlank] = useState(0);
  const [totalComment, setTotalComment] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [totalComplexity, setTotalComplexity] = useState(0);

  useEffect(() => {
    results?.forEach((result) => {
      setTotalCount((prevCount) => prevCount + result.Count);
      setTotalBlank((prevBlank) => prevBlank + result.Blank);
      setTotalComment((prevComment) => prevComment + result.Comment);
      setTotalLines((prevLines) => prevLines + result.Lines);
      setTotalComplexity(
        (prevComplexity) => prevComplexity + result.Complexity,
      );
    });
  }, [results]);

  return (
    <Card {...other}>
      <CardHeader
        title='Code Analysis'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
        }}
      >
        Code Analysis
      </CardHeader>
      <CardContent>
        <TableContainer>
          <Table>
            <caption>
              Language detection is best effort and may not be 100% accurate.{' '}
              <i>(Last updated: {dateTimeRelative(tsCreated)})</i>
            </caption>
            <TableHead>
              <TableRow>
                <TableCell>Language</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Blank</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Lines</TableCell>
                <TableCell>Complexity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => {
                return (
                  <TableRow key={result.Name}>
                    <TableCell>{result.Name}</TableCell>
                    <TableCell>{result.Count.toLocaleString()}</TableCell>
                    <TableCell>{result.Blank.toLocaleString()}</TableCell>
                    <TableCell>{result.Comment.toLocaleString()}</TableCell>
                    <TableCell>{result.Lines.toLocaleString()}</TableCell>
                    <TableCell>{result.Complexity.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow key={'total'} sx={{ borderTop: 'solid 2px' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {totalCount.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {totalBlank.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {totalComment.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {totalLines.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {totalComplexity.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default SccResults;
