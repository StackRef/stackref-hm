import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetParticipants from 'src/components/stackref/GetParticipants';

const initialState = {
  isLoaded: false,
  isGetting: false,
  getError: false,
  data: [],
};

export const getParticipants = createAsyncThunk(
  'participants/getParticipants',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetParticipants(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> participants/getParticipants: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const setParticipants = createAsyncThunk(
  'participants/setParticipants',
  async (params, { rejectWithValue }) => {
    try {
      return params;
    } catch (err) {
      console.error(`>> participants/setParticipants: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const removeFromParticipants = (participantUuid) => async (dispatch) => {
  dispatch(slice.actions.removeFromParticipants(participantUuid));
};

export const addToParticipants = (participant) => async (dispatch) => {
  dispatch(slice.actions.addToParticipants(participant));
};

const slice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    removeFromParticipants(state, action) {
      const participantUuid = action.payload;

      state.data = state.data.filter(
        (i) => i.participant_uuid !== participantUuid,
      );
    },
    addToParticipants(state, action) {
      const participant = action.payload;
      const newParticipants = state.data;

      newParticipants.push(participant);
      state.data = newParticipants;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getParticipants.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getParticipants.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getParticipants.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(setParticipants.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(setParticipants.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(setParticipants.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      });
  },
});

export const { reducer } = slice;

export default slice;
