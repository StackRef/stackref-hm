import { createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { setNotifications } from 'src/slices/notifications';
import { useDispatch, useSelector } from 'src/store';

console.log(':: NotificationsContext');

const initialNotifications = {
  storedNotifications: [],
};

export const restoreNotifications = () => {
  let storedNotifications = [];

  try {
    const storedData = window.localStorage.getItem('notifications');

    if (storedData) {
      storedNotifications = JSON.parse(storedData);
    } else {
      storedNotifications = [];
    }
  } catch (err) {
    console.error(`>> restoreNotifications: ${err}`);
  }

  return storedNotifications;
};

export const storeNotifications = (notifications) => {
  console.log(':: storeNotifications');
  window.localStorage.setItem('notifications', JSON.stringify(notifications));
};

const NotificationsContext = createContext({
  storedNotifications: initialNotifications,
  addNotification: () => {},
  saveNotifications: () => {},
});

export const NotificationsProvider = (props) => {
  console.log(':: NotificationsProvider');

  const { children } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    const restoredNotifications = restoreNotifications();

    if (restoredNotifications) {
      dispatch(setNotifications(restoredNotifications));
    }
  }, [dispatch]);

  const saveNotifications = (notifications) => {
    storeNotifications(notifications);
  };

  const addStoredNotification = (notification) => {
    const restoredNotifications = restoreNotifications();

    saveNotifications([notification, ...restoredNotifications]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        addStoredNotification,
        saveNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

NotificationsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const NotificationsConsumer = NotificationsContext.Consumer;

export default NotificationsContext;
