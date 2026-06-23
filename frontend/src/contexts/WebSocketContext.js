import { createContext, useCallback, useEffect, useReducer } from 'react';
import { produce } from 'immer';
import { stackrefConfig } from 'src/config';
import useAuth from 'src/hooks/useAuth';
import CheckAuth from 'src/components/stackref/CheckAuth';

console.log(':: WebSocketContext');

const initialState = {
  needsReconnect: false,
  reconnectDelay: 0,
  joinedRooms: [],
  socket: null,
};

const specificStatusCodeMappings = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1004: '(For future)',
  1005: 'No Status Received',
  1006: 'Abnormal Closure',
  1007: 'Invalid frame payload data',
  1008: 'Policy Violation',
  1009: 'Message too big',
  1010: 'Missing Extension',
  1011: 'Internal Error',
  1012: 'Service Restart',
  1013: 'Try Again Later',
  1014: 'Bad Gateway',
  1015: 'TLS Handshake',
};

function getStatusCodeString(code) {
  if (code >= 0 && code <= 999) {
    return '(Unused)';
  } else if (code >= 1016) {
    if (code <= 1999) {
      return '(For WebSocket standard)';
    } else if (code <= 2999) {
      return '(For WebSocket extensions)';
    } else if (code <= 3999) {
      return '(For libraries and frameworks)';
    } else if (code <= 4999) {
      return '(For applications)';
    }
  }
  if (typeof specificStatusCodeMappings[code] !== 'undefined') {
    return specificStatusCodeMappings[code];
  }
  return '(Unknown)';
}

const handlers = {
  INITIALIZE: (state, action) => {
    const { socket } = action.payload;

    return {
      ...state,
      needsReconnect: false,
      joinedRooms: [],
      socket,
    };
  },
  REMOVE_ROOM: (state, action) => {
    const { roomUuid } = action.payload;
    let newJoinedRooms = state.joinedRooms;

    newJoinedRooms = produce(newJoinedRooms, (draftState) => {
      const index = draftState.findIndex((room) => room.roomUuid === roomUuid);
      if (index !== -1) draftState.splice(index, 1);
    });

    return {
      ...state,
      joinedRooms: newJoinedRooms,
    };
  },
  ADD_ROOM: (state, action) => {
    const { roomUuid, roomName } = action.payload;
    let newJoinedRooms = state.joinedRooms;

    newJoinedRooms = produce(newJoinedRooms, (draftState) => {
      const index = draftState.findIndex((room) => room.roomUuid === roomUuid);
      if (index !== -1) draftState.splice(index, 1); // Remove if already present
      draftState.push({ roomUuid: roomUuid, roomName: roomName }); // ... then add
    });

    return {
      ...state,
      joinedRooms: newJoinedRooms,
    };
  },
  DISCONNECT: async (state, action) => {
    try {
      await state.socket?.close();
    } catch (error) {
      console.error(`>> DISCONNECT: ${error}`);
    }

    return {
      ...state,
      joinedRooms: [],
      socket: null,
    };
  },
  NEEDS_RECONNECT: (state, action) => {
    const { reconnectDelay } = action?.payload || 0;

    return {
      ...state,
      needsReconnect: true,
      reconnectDelay: reconnectDelay,
      joinedRooms: [],
      socket: null,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

const WebSocketContext = createContext({
  ...initialState,
  disconnect: () => Promise.resolve(),
  addRoom: () => Promise.resolve(),
  removeRoom: () => Promise.resolve(),
});

export const WebSocketProvider = (props) => {
  const { children } = props;
  const { user, isAuthenticated, logout } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const retryDelay = () => new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(':: WebSocketProvider');

  const getSocket = useCallback(async () => {
    if (getSocket.server && getSocket.server.readyState < 2) {
      console.log(
        `:: Reusing the ws connection [state = ${getSocket.server.readyState}]`,
      );
      return Promise.resolve(getSocket.server);
    }

    return new Promise(function (resolve, reject) {
      const token = user?.token;
      if (token) {
        getSocket.server = new WebSocket(
          `${stackrefConfig.wsBase}?auth=${token}`,
        );

        // This allows for only returning the socket promise when the socket is actually open and ready
        getSocket.server.onopen = function () {
          console.log(
            `:: ws connection is opened [state = ${getSocket.server.readyState}]`,
          );
          resolve(getSocket.server);
        };

        getSocket.server.onerror = function (error) {
          console.error('>> ws connection error:', error.message);
          reject(error);
        };
      } else {
        reject('no token present');
      }
    });
  }, [user?.token]);

  const closeEventListener = useCallback(
    (event) => {
      console.log(
        `:: ws connection closed: ${getStatusCodeString(event.code)}`,
      );
      if (event.code === 1001) {
        // Going Away
        dispatch({
          type: 'NEEDS_RECONNECT',
        });
        return;
      }
      if (isAuthenticated && (event.code === 1006 || event.code === 1005)) {
        dispatch({
          type: 'NEEDS_RECONNECT',
          payload: {
            reconnectDelay: 10000,
          },
        });
      }
    },
    [isAuthenticated],
  );

  const errorEventListener = useCallback((event) => {
    console.error(`>> errorEventListener: ${JSON.stringify(event)}`);
  }, []);

  const messageListener = useCallback((event) => {
    if (event.origin === stackrefConfig.wsBase) {
      console.log(
        `:: Message received from ${event.origin}: ${JSON.stringify(
          event.data,
        )}`,
      );
    } else {
      console.error(`>> Unauthorized message received from ${event.origin}`);
    }
  }, []);

  const cleanupListeners = useCallback(() => {
    if (state.socket) {
      console.log(':: Removing main WS event listeners');
      state.socket.removeEventListener('error', errorEventListener);
      state.socket.removeEventListener('close', closeEventListener);
      state.socket.removeEventListener('message', messageListener);
    }
  }, [closeEventListener, errorEventListener, messageListener, state.socket]);

  const setupListeners = useCallback(() => {
    if (state.socket && stackrefConfig.wsEnabled !== 'false') {
      console.log(':: Adding main WS event listeners');
      try {
        state.socket.addEventListener('error', errorEventListener);
        state.socket.addEventListener('close', closeEventListener);
        state.socket.addEventListener('message', messageListener);
      } catch (error) {
        console.error(`>> wsListeners: ${error}`);
      }
    }
  }, [closeEventListener, errorEventListener, messageListener, state.socket]);

  useEffect(() => {
    setupListeners();
    return () => cleanupListeners();
  }, [cleanupListeners, setupListeners]);

  const issueConnect = useCallback(async () => {
    console.log(':: issueConnect');
    if (isAuthenticated) {
      try {
        const socket = await getSocket().catch(() =>
          retryDelay().then(() => getSocket()),
        );
        dispatch({
          type: 'INITIALIZE',
          payload: {
            socket: socket,
          },
        });
      } catch (err) {
        console.error('>> WebSocketProvider: ', err);
      }
    } else {
      disconnect();
    }
  }, [getSocket, isAuthenticated]);

  useEffect(() => {
    issueConnect();
    return () => disconnect();
  }, [issueConnect]);

  const issueReconnect = useCallback(() => {
    if (state.needsReconnect && isAuthenticated) {
      console.log(':: issueReconnect');
      const reconnect = async () => {
        try {
          const socket = await getSocket();
          dispatch({
            type: 'INITIALIZE',
            payload: {
              socket: socket,
            },
          });
        } catch (err) {
          console.error('>> issueReconnect:', err);
          // Test whether Auth is still valid and logout if not
          await CheckAuth(user).catch((err) => {
            logout();
          });
          await retryDelay();
          await reconnect();
        }
      };
      setTimeout(reconnect, state.reconnectDelay);
    }
  }, [
    getSocket,
    isAuthenticated,
    logout,
    state.needsReconnect,
    state.reconnectDelay,
    user,
  ]);

  useEffect(() => {
    issueReconnect();
  }, [issueReconnect]);

  const disconnect = async () => {
    console.log(':: WS disconnect');
    try {
      dispatch({
        type: 'DISCONNECT',
      });
    } catch (err) {
      console.error(`>> disconnect: ${err}`);
    }
  };

  const addRoom = (roomUuid, roomName) => {
    try {
      dispatch({
        type: 'ADD_ROOM',
        payload: {
          roomUuid: roomUuid,
          roomName: roomName,
        },
      });
    } catch (err) {
      console.error(`>> addRoom: ${err}`);
    }
  };

  const removeRoom = (roomUuid) => {
    try {
      dispatch({
        type: 'REMOVE_ROOM',
        payload: {
          roomUuid: roomUuid,
        },
      });
    } catch (err) {
      console.error(`>> removeRoom: ${err}`);
    }
  };

  const pingWebsocket = useCallback(() => {
    if (state.socket) {
      try {
        console.log(':: ping');
        state.socket.send('{"action":"ping"}');
      } catch (error) {
        console.error(`>> pingWebsocket: ${error}`);
      }
    }
  }, [state.socket]);

  // Continually ping websocket to keep it alive
  useEffect(() => {
    const delay = 10000;
    const pingInterval = setInterval(() => {
      pingWebsocket();
    }, delay);
    return () => clearInterval(pingInterval);
  }, [pingWebsocket]);

  return (
    <WebSocketContext.Provider
      value={{
        ...state,
        disconnect,
        addRoom,
        removeRoom,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
