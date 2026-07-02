import { Box, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Logo } from './Logo';

const SlashScreen = () => (
  <Box
    sx={{
      bgcolor: useTheme().palette.background.paper,
      height: '100%',
      pt: 6,
    }}
  >
    <Grid
      container
      spacing={0}
      direction='column'
      alignItems='center'
      justifyContent='center'
      style={{ minHeight: '100vh' }}
    >
      <Logo
        animate='true'
        sx={{
          width: '160px',
          height: '160px',
        }}
      />
    </Grid>
  </Box>
);

export default SlashScreen;
