import { useContext } from 'react';

import WebSocketContext from 'src/contexts/WebSocketContext';

const useWebSocket = () => useContext(WebSocketContext);

export default useWebSocket;
