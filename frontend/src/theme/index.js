import merge from 'lodash/merge';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { THEMES } from 'src/constants';
import { lightShadows, darkShadows } from './shadows';

const baseOptions = {
  direction: 'ltr',
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#ffffff',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          color: '#ffffff',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        fallback: {
          height: '75%',
          width: '75%',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: {
          variant: 'h6',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          marginRight: '16px',
        },
      },
    },
  },
  typography: {
    button: {
      fontWeight: 600,
    },
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: {
      fontWeight: 600,
      fontSize: '3.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '3rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2.25rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    overline: {
      fontWeight: 600,
    },
  },
};

const themesOptions = {
  [THEMES.LIGHT]: {
    components: {
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&::placeholder': {
              opacity: 0.86,
              color: '#42526e',
            },
          },
        },
      },
    },
    palette: {
      action: {
        active: '#6b778c',
      },
      background: {
        default: '#f4f5f7',
        paper: '#ffffff',
        tableHead: '#49515d',
      },
      error: {
        contrastText: '#ffffff',
        main: '#f44336',
      },
      mode: 'light',
      primary: {
        contrastText: '#ffffff',
        main: '#5664d2',
      },
      success: {
        contrastText: '#ffffff',
        main: '#4caf50',
      },
      text: {
        primary: '#172b4d',
        secondary: '#6b778c',
      },
      warning: {
        contrastText: '#ffffff',
        main: '#ff9800',
      },
    },
    shadows: lightShadows,
  },
  [THEMES.DARK]: {
    components: {
      MuiInputBase: {
        styleOverrides: {
          input: {
            color: '#fffff',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            color: '#fffff',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(145, 158, 171, 0.24)',
          },
        },
      },
    },
    palette: {
      background: {
        default: '#171c24',
        paper: '#222b36',
        tableHead: '#49515d',
      },
      divider: 'rgba(145, 158, 171, 0.24)',
      error: {
        contrastText: '#ffffff',
        main: '#f44336',
      },
      mode: 'dark',
      primary: {
        contrastText: '#ffffff',
        main: '#688eff',
      },
      success: {
        contrastText: '#ffffff',
        main: '#4caf50',
      },
      text: {
        primary: '#ffffff',
        secondary: '#919eab',
      },
      warning: {
        contrastText: '#ffffff',
        main: '#ff9800',
      },
    },
    shadows: darkShadows,
  },
};

export const createMyTheme = (config = {}) => {
  let themeOptions = themesOptions[THEMES.DARK];

  if (!themeOptions) {
    console.warn(new Error(`The theme ${config.theme} is not valid`));
    themeOptions = themesOptions[THEMES.DARK];
  }

  let theme = createTheme(
    merge(
      {},
      baseOptions,
      themeOptions,
      {
        ...(config.roundedCorners && {
          shape: {
            borderRadius: 16,
          },
        }),
      },
      {
        direction: config.direction,
      },
    ),
  );

  if (config.responsiveFontSizes) {
    theme = responsiveFontSizes(theme);
  }

  return theme;
};
