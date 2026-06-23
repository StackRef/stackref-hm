import { useState } from 'react';
import useStackRef from 'src/hooks/useStackRef';
import Carousel from 'react-material-ui-carousel';
import ReactPlayer from 'react-player/lazy';
import { ReactPlayer as RP } from 'react-player';
import { Box, Skeleton, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

const TeamVideos = (props) => {
  const { videoLinks, ...other } = props;
  const { activeTeam } = useStackRef();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [videoError, setVideoError] = useState(null);

  function isValidURL(url) {
    const regex = /^https:\/\//;
    return regex.test(url);
  }

  const validVideoLinks = videoLinks?.filter((link) =>
    isValidURL(link.team_external_link_url),
  );

  const handleSlideChange = (index) => {
    setVideoError(null);
    setCurrentSlideIndex(index);
  };

  const theme = createTheme({
    breakpoints: {
      values: {
        mobile: 0,
        tablet: 640,
        laptop: 1024,
        desktop: 1200,
      },
    },
  });

  const VideoError = (props) => {
    const { videoUrl } = props;

    if (videoError) {
      return (
        <Box
          width='100%'
          height='100%'
          display='flex'
          justifyContent='center'
          alignItems='center'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
            zIndex: 1,
          }}
        >
          <div>
            <Typography
              color='error'
              align='center'
              variant='h6'
              sx={{ m: 'auto' }}
            >
              Video Unplayable
            </Typography>
            <Typography
              color='error'
              align='center'
              variant='body2'
              sx={{ m: 'auto' }}
            >
              {videoUrl}
            </Typography>
          </div>
        </Box>
      );
    }

    return null;
  };

  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'));
  const isTablet = useMediaQuery(theme.breakpoints.between('tablet', 'laptop'));

  const videoWidth = isMobile ? 360 : 640;
  const videoHeight = isMobile ? 240 : 360;

  return validVideoLinks && validVideoLinks.length > 0 ? (
    <ThemeProvider theme={theme}>
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={videoHeight + 30}
        width='100%'
      >
        <div style={{ width: videoWidth, height: videoHeight + 30 }}>
          <Carousel
            autoPlay={false}
            className='video-carousel'
            onChange={handleSlideChange}
            sx={{
              height: videoHeight + 30,
              width: videoWidth,
            }}
          >
            {validVideoLinks.map((link, index) => (
              <div key={link.team_external_link_uuid}>
                {index === currentSlideIndex && (
                  <>
                    <ReactPlayer
                      key={link.team_external_link_uuid}
                      height={videoHeight}
                      width={videoWidth}
                      fallback={
                        <Skeleton
                          sx={{ width: videoWidth, height: videoHeight + 30 }}
                        />
                      }
                      url={link.team_external_link_url}
                      onError={() => setVideoError(true)}
                    />
                    <VideoError videoUrl={link.team_external_link_url} />
                  </>
                )}
              </div>
            ))}
          </Carousel>
        </div>
      </Box>
    </ThemeProvider>
  ) : null;
};

export default TeamVideos;
