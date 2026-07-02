import { useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import useSpotify from 'src/hooks/useSpotify';
import useSettings from 'src/hooks/useSettings';
import TeamSpotify from 'src/components/dashboard/team/TeamSpotify';

const SpotifyPopover = () => {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [isMinimized, setMinimized] = useState(false);
  const { setSpotifyInToolbar, spotifyLinks, spotifyInToolbar } = useSpotify();
  const { settings, saveSettings } = useSettings();

  console.log(':: SpotifyPopover');

  const handleSettingsChange = (field, value) => {
    saveSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleOpen = () => {
    setMinimized(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSpotifyInToolbar(false);
    handleSettingsChange('spotifyInToolbar', false);
  };

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleMaximize = () => {
    setMinimized(false);
  };

  return spotifyLinks?.length < 1 || !spotifyInToolbar ? null : (
    <>
      <Tooltip title='Team Playlist'>
        <IconButton color='inherit' onClick={handleOpen} ref={anchorRef}>
          <QueueMusicRoundedIcon />
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorRef.current}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        onClose={handleMinimize}
        open={open}
        slotProps={{
          paper: {
            sx: {
              width: 335,
            },
          },
        }}
        sx={{
          display: isMinimized ? 'none' : 'block',
        }}
      >
        <Card>
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              px: 2,
              py: 1,
            }}
          >
            <Box sx={{ display: 'block', width: '100%' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                width='100%'
              >
                <Typography color={theme.palette.background.paper} variant='h6'>
                  Team Playlist
                </Typography>
                <Tooltip title='Remove from toolbar'>
                  <IconButton
                    color={theme.palette.background.paper}
                    onClick={handleClose}
                  >
                    <CancelRoundedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          <CardContent>
            {spotifyLinks?.length < 1 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography sx={{ color: 'text.secondary' }}>
                  No team playlists added
                </Typography>
              </Box>
            ) : (
              <TeamSpotify />
            )}
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};

export default SpotifyPopover;
