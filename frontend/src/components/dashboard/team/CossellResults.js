import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import PsychologyAltRoundedIcon from '@mui/icons-material/PsychologyAltRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import { dateTimeRelative } from 'src/utils/dtmFormatting';

const CossellResults = (props) => {
  const { results, tsCreated, ...other } = props;
  const theme = useTheme();

  return (
    <Card {...other}>
      <CardHeader
        title="StackRef's Analysis"
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
        }}
      ></CardHeader>
      <CardContent>
        <Typography variant='h6'>Code Summary</Typography>
        <Typography sx={{ ml: 2 }}>
          {results.code_summary || 'None provided'}
        </Typography>
        <Typography variant='h6' sx={{ mt: 2 }}>
          Commentary
        </Typography>
        <Typography sx={{ ml: 2 }}>
          {results.commentary || 'None provided'}
        </Typography>
        <Typography variant='h6' sx={{ mt: 2 }}>
          Scores (1-10)
        </Typography>
        <List>
          <ListItem>
            <ListItemAvatar sx={{ display: 'flex', justifyContent: 'center' }}>
              <CodeRoundedIcon />
              <Typography>Code Smells:</Typography>
            </ListItemAvatar>
            <ListItemText sx={{ ml: 1 }}>
              <b>{results.scores?.code_smells || '??'}</b>
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemAvatar sx={{ display: 'flex', justifyContent: 'center' }}>
              <PsychologyAltRoundedIcon />
              <Typography>Complexity:</Typography>
            </ListItemAvatar>
            <ListItemText sx={{ ml: 1 }}>
              <b>{results.scores?.complexity || '??'}</b>
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemAvatar sx={{ display: 'flex', justifyContent: 'center' }}>
              <SecurityRoundedIcon />
              <Typography>Security:</Typography>
            </ListItemAvatar>
            <ListItemText sx={{ ml: 1 }}>
              <b>{results.scores?.security || '??'}</b>
            </ListItemText>
          </ListItem>
        </List>
        <Typography
          variant='caption'
          sx={{ display: 'block', fontStyle: 'italic', mt: 2 }}
        >
          (Last updated: {dateTimeRelative(tsCreated)})
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CossellResults;
