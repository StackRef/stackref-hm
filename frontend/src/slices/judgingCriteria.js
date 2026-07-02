import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetEventJudgingCriteria from 'src/components/stackref/GetEventJudgingCriteria';

const initialState = {
  isLoaded: false,
  isGetting: false,
  getError: false,
  data: [],
};

export const getJudgingCriteria = createAsyncThunk(
  'judgingCriteria/getJudgingCriteria',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetEventJudgingCriteria(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> judgingCriteria/getJudgingCriteria: ${err}`);
      rejectWithValue(err);
    }
  },
);

export const setJudgingCriteria = createAsyncThunk(
  'judgingCriteria/setJudgingCriteria',
  async (params, { rejectWithValue }) => {
    try {
      return params;
    } catch (err) {
      console.error(`>> judgingCriteria/setJudgingCriteria: ${err}`);
      rejectWithValue(err);
    }
  },
);

export const removeFromJudgingCriteria =
  (judgingCriterionUuid) => async (dispatch) => {
    dispatch(slice.actions.removeFromJudgingCriteria(judgingCriterionUuid));
  };

export const addToJudgingCriteria = (judgingCriterion) => async (dispatch) => {
  dispatch(slice.actions.addToJudgingCriteria(judgingCriterion));
};

const slice = createSlice({
  name: 'judgingCriteria',
  initialState,
  reducers: {
    removeFromJudgingCriteria(state, action) {
      const judgingCriterionUuid = action.payload;

      state.data = state.data.filter(
        (i) => i.judging_criterion_uuid !== judgingCriterionUuid,
      );
    },
    addToJudgingCriteria(state, action) {
      const judgingCriterion = action.payload;
      const newJudgingCriteria = state.data;

      newJudgingCriteria.push(judgingCriterion);
      state.data = newJudgingCriteria;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getJudgingCriteria.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getJudgingCriteria.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getJudgingCriteria.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(setJudgingCriteria.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(setJudgingCriteria.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(setJudgingCriteria.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      });
  },
});

export const { reducer } = slice;

export default slice;
