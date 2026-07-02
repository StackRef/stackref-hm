import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Link } from '@mui/material';

const PurchaseStackCash = (props) => {
  const { ...other } = props;

  console.log(':: PurchaseStackCash');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...other,
      }}
    >
      <Link
        component={RouterLink}
        to={'/dashboard/marketplace'}
        sx={{ textDecoration: 'none' }}
      >
        <Button variant='contained'>Purchase StackCash</Button>
      </Link>
    </Box>
  );
};

export default PurchaseStackCash;
