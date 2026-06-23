import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetCoinBalance from 'src/components/stackref/GetCoinBalance';
import CoinBankTransaction from 'src/components/dashboard/admin/CoinBankTransaction';

const initialState = {
  isLoaded: false,
  isGetting: false,
  isPosting: false,
  getError: false,
  postError: false,
  postSuccess: false,
  orgTransactions: {},
  eventTransactions: {},
  teamTransactions: {},
};

export const getBankBalance = createAsyncThunk(
  'bankTransaction/getBankBalance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetCoinBalance(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> bankTransaction/getBankBalance ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const postBankTransaction = createAsyncThunk(
  'bankTransaction/postBankTransaction',
  async (params, { rejectWithValue }) => {
    try {
      await CoinBankTransaction(params, (response) => {
        if (!response || response.status_code !== 200)
          throw new Error('Score update failed');
        return true;
      });
    } catch (err) {
      console.error(`>> bankTransaction/postBankTransaction ${err.message}`);
      return rejectWithValue('Score update failed');
    }
  },
);

const slice = createSlice({
  name: 'bankTransaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTeamScoreItems.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getTeamScoreItems.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getTeamScoreItems.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload;
      })
      .addCase(postTeamScoreItems.pending, (state, action) => {
        state.isPosting = true;
        state.postError = false;
        state.postSuccess = false;
      })
      .addCase(postTeamScoreItems.rejected, (state, { payload }) => {
        state.postError = payload;
        state.postSuccess = false;
        state.isPosting = false;
        console.error(`>> ${payload}`);
      })
      .addCase(postTeamScoreItems.fulfilled, (state, { payload }) => {
        state.isPosting = false;
        state.postSuccess = 'Scores updated';
      });
  },
});

export const { reducer } = slice;

export default slice;
