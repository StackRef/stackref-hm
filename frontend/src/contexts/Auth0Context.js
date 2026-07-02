import { createContext, useEffect, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { createAuth0Client } from '@auth0/auth0-spa-js';
import { auth0Config } from 'src/config';
import { jwtDecode } from 'jwt-decode';
import GetUser from 'src/components/stackref/GetUser';
import UserEdit from 'src/components/user/UserEdit';
import { toast } from 'react-toastify';

let auth0Client = null;

console.log(':: INITIALIZING STATE');

const initialState = {
  logoutMessage: null,
  buttonText: null,
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const handlers = {
  INITIALIZE: (state, action) => {
    console.log(':: AUTH INITIALIZE');
    const { isAuthenticated, user } = action.payload;

    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },
  LOGIN: (state, action) => {
    const { user } = action.payload;

    return {
      ...state,
      logoutMessage: null,
      isAuthenticated: true,
      user,
    };
  },
  REFRESH_TOKEN: (state, action) => {
    const { user } = action.payload;

    return {
      ...state,
      user: {
        ...state.user,
        ...user,
      },
    };
  },
  UPDATE_USER_ORG: (state, action) => {
    const organizationUuid = action.payload;

    return {
      ...state,
      user: {
        ...state.user,
        organization_uuid: organizationUuid,
      },
    };
  },
  UPDATE_USER: (state, action) => {
    const updatedUser = action.payload;

    const payload = {
      action: updatedUser.action,
      user: state.user,
      user_payload: {
        user_uuid: state.user.user_uuid,
        ...updatedUser.user_payload,
      },
      settings: {
        ...state.user.settings,
        ...updatedUser.settings,
      },
      tags: {
        ...state.user.tags,
        ...updatedUser.tags,
      },
    };

    try {
      UserEdit(payload, (response) => {
        if (!response) throw new Error('User update failed');
      }).catch((error) => {
        console.log(`>> UserEdit: ${error}`);
        throw error;
      });
    } catch (error) {
      console.log(`>> UPDATE_USER: ${error}`);
    }

    return {
      ...state,
      user: {
        ...state.user,
        ...updatedUser.user_payload,
        settings: {
          ...state.user.settings,
          ...updatedUser.settings,
        },
        tags: {
          ...state.user.tags,
          ...updatedUser.tags,
        },
      },
    };
  },
  LOGOUT: (state, action) => {
    console.log(':: LOGOUT');

    const { logoutMessage, buttonText } = action?.payload;

    return {
      ...state,
      logoutMessage: logoutMessage || 'You have logged out',
      buttonText: buttonText || 'Log In / Sign Up',
      isAuthenticated: false,
      user: null,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

const AuthContext = createContext({
  ...initialState,
  platform: 'Auth0',
  loginWithRedirect: () => Promise.resolve(),
  logout: () => Promise.resolve(),
});

export const AuthProvider = (props) => {
  const { children } = props;
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  console.log(':: AuthProvider');

  useEffect(() => {
    const initialize = async () => {
      console.log(':: Auth0: initialize');
      try {
        auth0Client = await createAuth0Client({
          authorizationParams: {
            audience: 'https://be.acme.example.com',
            redirectUri: window.location.origin,
          },
          ...auth0Config,
        });

        const query = window.location.search;

        // AWS Marketplace
        if (searchParams.get('x-amzn-marketplace-token')) {
          const amznMarketplaceToken = searchParams.get(
            'x-amzn-marketplace-token',
          );
          window.localStorage.setItem(
            'amznMarketplaceToken',
            amznMarketplaceToken,
          );
        }

        if (searchParams.get('code') && searchParams.get('state')) {
          await auth0Client.handleRedirectCallback();
          window.history.replaceState({}, document.title, '/dashboard');
        } else if (searchParams.get('email_verified') === 'false') {
          await auth0Client.handleRedirectCallback();
        }

        const isAuthenticated = await auth0Client.isAuthenticated();
        const token = await auth0Client.getTokenSilently();

        if (isAuthenticated) {
          const user = await auth0Client.getUser();
          const claims = await auth0Client.getIdTokenClaims();
          const srUser = await GetUser(user, token);
          const claimsDecoded = jwtDecode(claims.__raw);

          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated,
              user: {
                id: user.sub,
                user_uuid: claimsDecoded['https://acme.example.com/sr-user-uuid'],
                registered: srUser.registered,
                avatar: user.picture,
                email: srUser.email_address || user.email,
                phone: srUser.phone,
                full_name: user.name,
                first_name: srUser.first_name || user.given_name,
                last_name: srUser.last_name || user.family_name,
                organization_uuid:
                  claimsDecoded['https://acme.example.com/sr-organization-uuid'],
                organization_name: srUser.organization_name,
                job_title: srUser.job_title,
                user_role_grants: srUser.user_role_grants,
                updated_at: user.updated_at,
                token: token,
                issued_at: claimsDecoded.iat,
                claims: claims.__raw,
                settings: srUser.settings || {},
                tags: srUser.tags || {},
              },
            },
          });
        } else {
          logout();
        }
      } catch (err) {
        err.message !== 'Login required' &&
          err.message !== 'Missing Refresh Token' &&
          console.error(`>> AuthProvider: ${err}`);
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithRedirect = async (options) => {
    console.log(':: Auth0: loginWithRedirect');

    await auth0Client.loginWithRedirect(options);

    const isAuthenticated = await auth0Client.isAuthenticated();
    const token = await auth0Client.getTokenSilently();
    const claims = await auth0Client.getIdTokenClaims();
    const claimsDecoded = jwtDecode(claims.__raw);

    if (isAuthenticated) {
      const user = await auth0Client.getUser();
      const srUser = await GetUser(user, token);

      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            id: user.sub,
            user_uuid: claimsDecoded['https://acme.example.com/sr-user-uuid'],
            registered: srUser.registered,
            avatar: user.picture,
            email: srUser.email_address || user.email,
            phone: srUser.phone,
            full_name: user.name,
            first_name: srUser.first_name || user.given_name,
            last_name: srUser.last_name || user.family_name,
            organization_uuid:
              claimsDecoded['https://acme.example.com/sr-organization-uuid'],
            organization_name: srUser.organization_name,
            job_title: srUser.job_title,
            user_role_grants: srUser.user_role_grants,
            updated_at: user.updated_at,
            token: token,
            issued_at: claimsDecoded.iat,
            claims: claims.__raw,
            settings: srUser.settings || {},
            tags: srUser.tags || {},
          },
        },
      });
    }
  };

  const updateUser = async (updatedUser) => {
    console.log(':: Auth0: updateUser');
    try {
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
    } catch (err) {
      console.error(`>> Auth0 updateUser: ${err}`);
    }
  };

  const updateUserOrg = async (organizationUuid) => {
    console.log(':: Auth0: updateUserOrg');
    try {
      dispatch({
        type: 'UPDATE_USER_ORG',
        payload: organizationUuid,
      });
    } catch (err) {
      console.error(`>> Auth0 updateUserOrg: ${err}`);
    }
  };

  const logout = async (logoutMessage = null, buttonText = null) => {
    dispatch({
      type: 'LOGOUT',
      payload: {
        logoutMessage: logoutMessage,
        buttonText: buttonText,
      },
    });

    try {
      toast.dismiss({ containerId: 'results' });
      toast.dismiss({ containerId: 'notifications' });
    } catch (error) {
      console.error(`>> logout: ${error}`);
    }

    auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin + '/dashboard',
      },
    });
  };

  const logoutLocal = async (logoutMessage = null, buttonText = null) => {
    console.log(':: logoutLocal');
    try {
      dispatch({
        type: 'LOGOUT',
        payload: {
          logoutMessage: logoutMessage,
          buttonText: buttonText,
        },
      });

      try {
        toast.dismiss();
      } catch (error) {
        console.error(`>> logout: ${error}`);
      }

      auth0Client.logout({
        async onRedirect() {},
      });
    } catch (err) {
      console.error(`>> Auth0 logoutLocal: ${err}`);
    }
  };

  // Continually check for login expiration
  useEffect(() => {
    async function refreshToken() {
      auth0Client = await createAuth0Client({
        authorizationParams: {
          audience: 'https://be.acme.example.com',
          redirectUri: window.location.origin,
        },
        ...auth0Config,
      });

      const isAuthenticated = await auth0Client.isAuthenticated();
      const token = await auth0Client.getTokenSilently();

      if (isAuthenticated) {
        console.log(`:: OLD TOKEN: ${state.user?.token}`);
        const claims = await auth0Client.getIdTokenClaims();
        const claimsDecoded = jwtDecode(claims.__raw);
        console.log(`:: NEW TOKEN: ${token}`);

        dispatch({
          type: 'REFRESH_TOKEN',
          payload: {
            user: {
              token: token,
              issued_at: claimsDecoded.iat,
              claims: claims.__raw,
            },
          },
        });
      } else {
        logout();
      }
    }

    const tokenLifetimeMs = 86400000;
    const currentDtm = Math.round(new Date().getTime());

    const timer = setTimeout(
      () => {
        if (state.user?.issued_at) {
          console.log(':: SESSION EXPIRED');
          clearTimeout(timer);
          refreshToken();
        } else {
          clearTimeout(timer);
        }
      },
      tokenLifetimeMs - (currentDtm - state.user?.issued_at * 1000),
    );
    return () => clearTimeout(timer);
  }, [state.isAuthenticated, state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        platform: 'Auth0',
        loginWithRedirect,
        updateUser,
        updateUserOrg,
        logout,
        logoutLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
