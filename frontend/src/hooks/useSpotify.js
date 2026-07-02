import { useContext } from 'react';

import SpotifyContext from 'src/contexts/SpotifyContext';

const useSpotify = () => useContext(SpotifyContext);

export default useSpotify;
