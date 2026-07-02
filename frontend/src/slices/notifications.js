import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
};

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action) {
      const notifications = action.payload;
      // Sort newest first
      const sortedNotifications = []
        .concat(notifications)
        .sort((a, b) =>
          b.timestamp > a.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
        );

      state.data = sortedNotifications;
    },
    addNotification(state, action) {
      const notification = action.payload;

      // Check if notification with the same notification_uuid already exists
      const notificationExists = state.data.some(
        (existingNotification) =>
          existingNotification.notification_uuid ===
          notification.notification_uuid,
      );

      // Add the new notification only if it doesn't already exist
      if (!notificationExists) {
        const newNotifications = [notification, ...state.data];
        state.data = newNotifications;
      }
    },
  },
});

export const { reducer } = slice;

export const setNotifications = (params) => async (dispatch) => {
  console.log(':: setNotifications');
  dispatch(slice.actions.setNotifications(params));
};

export const addNotification = (params) => async (dispatch) => {
  console.log(':: addNotification');
  dispatch(slice.actions.addNotification(params));
};

export default slice;
