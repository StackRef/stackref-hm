import { useContext } from 'react';
import NotificationsContext from 'src/contexts/NotificationsContext';

const useNotifications = () => useContext(NotificationsContext);

export default useNotifications;
