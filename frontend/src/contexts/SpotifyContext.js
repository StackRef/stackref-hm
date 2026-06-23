import { createContext, useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import useStackRef from 'src/hooks/useStackRef';
import useSettings from 'src/hooks/useSettings';

console.log(':: SpotifyContext');

const initialState = {
  spotifyLinks: [],
  spotifyPlayingLink: null,
  spotifyInToolbar: false,
  spotifyIsPlaying: false,
};

const handlers = {
  SET_SPOTIFY_LINKS: (state, action) => {
    const { spotifyLinks } = action.payload;

    return {
      ...state,
      spotifyLinks,
    };
  },
  CLEAR_SPOTIFY_LINKS: (state) => ({
    ...state,
    spotifyLinks: [],
  }),
  SET_SPOTIFY_PLAYING: (state, action) => {
    const { spotifyIsPlaying } = action.payload;

    return {
      ...state,
      spotifyIsPlaying,
    };
  },
  SET_SPOTIFY_IN_TOOLBAR: (state, action) => {
    const { spotifyInToolbar } = action.payload;

    return {
      ...state,
      spotifyInToolbar,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

const SpotifyContext = createContext({
  ...initialState,
  setSpotifyLinks: () => Promise.resolve(),
  clearSpotifyLinks: () => Promise.resolve(),
  setSpotifyInToolbar: () => Promise.resolve(),
});

export const SpotifyProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { activeTeam } = useStackRef();
  const { settings, saveSettings } = useSettings();

  console.log(':: SpotifyProvider');

  const handleSettingsChange = (field, value) => {
    saveSettings({
      ...settings,
      [field]: value,
    });
  };

  function isValidSpotifyPlaylistURL(url) {
    const regex = /^https:\/\/open\.spotify\.com\/playlist\//;
    return regex.test(url);
  }

  const setSpotifyLinks = useCallback(() => {
    console.log(':: setSpotifyLinks');
    if (activeTeam) {
      const spotifyLinks =
        activeTeam.team_external_links?.filter(
          (link) => link.external_link_type_name === 'Spotify Playlist',
        ) || [];
      const validSpotifyLinks = spotifyLinks?.filter((link) =>
        isValidSpotifyPlaylistURL(link.team_external_link_url),
      );
      dispatch({
        type: 'SET_SPOTIFY_LINKS',
        payload: {
          spotifyLinks: validSpotifyLinks,
        },
      });
    } else {
      dispatch({
        type: 'CLEAR_SPOTIFY_LINKS',
      });
    }
  }, [activeTeam]);

  const setSpotifyInToolbar = (spotifyInToolbar) => {
    console.log(':: setSpotifyInToolbar');
    dispatch({
      type: 'SET_SPOTIFY_IN_TOOLBAR',
      payload: {
        spotifyInToolbar: spotifyInToolbar,
      },
    });
  };

  useEffect(() => {
    setSpotifyLinks();
  }, [setSpotifyLinks]);

  useEffect(() => {
    setSpotifyInToolbar(settings.spotifyInToolbar);
  }, [settings]);

  return (
    <SpotifyContext.Provider
      value={{
        ...state,
        setSpotifyLinks,
        clearSpotifyLinks: () => dispatch({ type: 'CLEAR_PLAYLIST_URLS' }),
        setSpotifyInToolbar,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

SpotifyContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SpotifyContext;
