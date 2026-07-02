import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetEvents from 'src/components/stackref/GetEvents';

const initialState = {
  isLoaded: false,
  isGetting: false,
  getError: false,
  data: {},
};

export const getOrgEvent = createAsyncThunk(
  'orgEvent/getOrgEvent',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetEvents(...Object.values(params));
      return response[0]; // TODO: Always returns an array and we only want one Event
    } catch (err) {
      console.error(`>> orgEvent/getOrgEvent: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const setOrgEvent = createAsyncThunk(
  'orgEvent/setOrgEvent',
  async (params, { rejectWithValue }) => {
    try {
      return params;
    } catch (err) {
      console.error(`>> orgEvent/setOrgEvent: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

const slice = createSlice({
  name: 'orgEvent',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getOrgEvent.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getOrgEvent.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getOrgEvent.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(setOrgEvent.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(setOrgEvent.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(setOrgEvent.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      });
  },
});

export const { reducer } = slice;

export default slice;
