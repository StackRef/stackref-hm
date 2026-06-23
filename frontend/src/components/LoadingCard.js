import { Card, CardContent, CardHeader, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LoadingCard = (props) => {
  const theme = useTheme();

  return (
    <Skeleton>
      <Card {...props}>
        <CardHeader>Loading ...</CardHeader>
        <CardContent>Content is loading. Please standby.</CardContent>
      </Card>
    </Skeleton>
  );
};

export default LoadingCard;
