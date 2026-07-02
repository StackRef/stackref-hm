import { useState } from 'react';
import { Box, Drawer, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import useStackRef from 'src/hooks/useStackRef';
import TeamInfoCard from './TeamInfoCard';

const TeamsListGrid = (props) => {
  const { setJudgingTeam, activeOrgEvent, ...other } = props;
  const { teams } = useStackRef();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);

  const TeamsGrid = styled(Grid)(({ theme }) => ({
    position: 'relative',
  }));

  const toggleDrawer = (open) => (event) => {
    setDrawerOpen(open);
    !open && setDrawerContent(null);
  };

  return (
    <Box height='100%' width='100%' {...other}>
      <Drawer anchor='right' open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
      <Grid container spacing={2}>
        {teams?.map((row, index) => {
          return (
            <TeamsGrid item key={row.team_uuid} lg={4} md={6} xl={3} xs={12}>
              <TeamInfoCard
                activeOrgEvent={activeOrgEvent}
                drawerOpen={drawerOpen}
                setJudgingTeam={setJudgingTeam}
                team={row}
                setDrawerOpen={setDrawerOpen}
                setDrawerContent={setDrawerContent}
              />
            </TeamsGrid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TeamsListGrid;
