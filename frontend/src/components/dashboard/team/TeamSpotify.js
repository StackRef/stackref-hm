import { useState } from 'react';
import { Box } from '@mui/material';
import { Spotify } from 'react-spotify-embed';
import Carousel from 'react-material-ui-carousel';
import useSpotify from 'src/hooks/useSpotify';

const TeamSpotify = (props) => {
  const { spotifyLinks } = useSpotify();
  const { ...other } = props;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleSlideChange = (index) => {
    setCurrentSlideIndex(index);
  };

  return spotifyLinks?.length > 0 ? (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      width='300px'
    >
      <div style={{ height: '400px', width: '300px' }}>
        <Carousel
          autoPlay={false}
          NavButton={() => null}
          onChange={handleSlideChange}
        >
          {spotifyLinks.map((link, index) => (
            <div key={link.team_external_link_uuid}>
              {index === currentSlideIndex && (
                <Spotify link={link.team_external_link_url} {...other} />
              )}
            </div>
          ))}
        </Carousel>
      </div>
    </Box>
  ) : null;
};

export default TeamSpotify;
