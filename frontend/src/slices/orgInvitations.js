import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetOrgInvitations from 'src/components/stackref/GetOrgInvitations';

const initialState = {
  isLoaded: false,
  isGetting: false,
  getError: false,
  data: [],
};

export const getOrgInvitations = createAsyncThunk(
  'orgInvitations/getOrgInvitations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetOrgInvitations(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> orgInvitations/getOrgInvitations: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const setOrgInvitations = createAsyncThunk(
  'orgInvitations/setOrgInvitations',
  async (params, { rejectWithValue }) => {
    try {
      return params;
    } catch (err) {
      console.error(`>> orgInvitations/setOrgInvitations: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const removeFromOrgInvitations =
  (invitationUuid) => async (dispatch) => {
    dispatch(slice.actions.removeFromOrgInvitations(invitationUuid));
  };

export const addToOrgInvitations = (orgInvitation) => async (dispatch) => {
  dispatch(slice.actions.addToOrgInvitations(orgInvitation));
};

const slice = createSlice({
  name: 'orgInvitations',
  initialState,
  reducers: {
    removeFromOrgInvitations(state, action) {
      const orgInvitationUuid = action.payload;

      state.data = state.data.filter(
        (i) => i.organization_invitation_uuid !== orgInvitationUuid,
      );
    },
    addToOrgInvitations(state, action) {
      const orgInvitation = action.payload;
      const newOrgInvitations = state.data;

      newOrgInvitations.push(orgInvitation);
      state.data = newOrgInvitations;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getOrgInvitations.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getOrgInvitations.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getOrgInvitations.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(setOrgInvitations.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(setOrgInvitations.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(setOrgInvitations.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      });
  },
});

export const { reducer } = slice;

export default slice;
