import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetTeams from 'src/components/stackref/GetTeams';

const initialState = {
  isLoaded: false,
  isGetting: false,
  getError: false,
  data: [],
};

export const getTeams = createAsyncThunk(
  'teams/getTeams',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetTeams(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> teams/getTeams: ${err}`);
      rejectWithValue(err);
    }
  },
);

export const setTeams = createAsyncThunk(
  'teams/setTeams',
  async (params, { rejectWithValue }) => {
    try {
      return params;
    } catch (err) {
      console.error(`>> teams/setTeams: ${err}`);
      rejectWithValue(err);
    }
  },
);

export const removeFromTeams = (teamUuid) => async (dispatch) => {
  dispatch(slice.actions.removeFromTeams(teamUuid));
};

export const addToTeams = (team) => async (dispatch) => {
  dispatch(slice.actions.addToTeams(team));
};

const slice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    removeFromTeams(state, action) {
      const teamUuid = action.payload;

      state.data = state.data.filter((i) => i.team_uuid !== teamUuid);
    },
    addToTeams(state, action) {
      const team = action.payload;
      const newTeams = state.data;

      newTeams.push(team);
      state.data = newTeams;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTeams.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getTeams.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getTeams.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(setTeams.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(setTeams.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(setTeams.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      });
  },
});

export const { reducer } = slice;

export default slice;
