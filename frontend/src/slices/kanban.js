import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import GetKanban from 'src/components/stackref/GetKanban';
import KanbanItemEdit from 'src/components/stackref/KanbanItemEdit';

const initialState = {
  isLoaded: false,
  isGetting: false,
  isPosting: false,
  getError: false,
  postError: false,
  postSuccess: false,
  data: {},
};

export const getKanbanItems = createAsyncThunk(
  'kanban/getKanbanItems',
  async (params, { rejectWithValue }) => {
    try {
      const response = await GetKanban(...Object.values(params));
      return response;
    } catch (err) {
      console.error(`>> kanban/getKanbanItems: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const postKanbanItems = createAsyncThunk(
  'kanban/postKanbanItems',
  async (params, { rejectWithValue }) => {
    try {
      await KanbanItemEdit(params, (response) => {
        if (!response || response.status_code !== 200)
          throw new Error('Kanban update failed');
        return true;
      });
    } catch (err) {
      console.error(`>> kanban/postKanbanItems: ${err}`);
      throw rejectWithValue(err);
    }
  },
);

export const removeFromKanbanItems = (kanbanItem) => async (dispatch) => {
  dispatch(slice.actions.removeFromKanbanItems(kanbanItem));
};

export const addToKanbanItems = (kanbanItem) => async (dispatch) => {
  dispatch(slice.actions.addToKanbanItems(kanbanItem));
};

export const moveKanbanItem = (kanbanItem) => async (dispatch) => {
  dispatch(slice.actions.moveKanbanItem(kanbanItem));
};

export const updateKanbanItems = (kanbanItems) => async (dispatch) => {
  dispatch(slice.actions.updateKanbanItems(kanbanItems));
};

export const reassignKanbanItem = (kanbanItem) => async (dispatch) => {
  dispatch(slice.actions.reassignKanbanItem(kanbanItem));
};

export const renameKanbanItem = (kanbanItem) => async (dispatch) => {
  dispatch(slice.actions.renameKanbanItem(kanbanItem));
};

const slice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    removeFromKanbanItems(state, action) {
      const kanbanItem = action.payload;
      console.log(kanbanItem);

      state.data.kanban_items = state.data.kanban_items?.filter(
        (i) => i.kanban_item_uuid !== kanbanItem.kanban_item_uuid,
      );
    },
    addToKanbanItems(state, action) {
      const kanbanItem = action.payload;
      const newKanbanItems = state.data.kanban_items;

      newKanbanItems.push(kanbanItem);
      state.data.kanban_items = newKanbanItems;
    },
    updateKanbanItems(state, action) {
      const updatedKanbanItems = action.payload;
      state.data.kanban_items = updatedKanbanItems;
    },
    moveKanbanItem(state, action) {
      const kanbanItem = action.payload.kanbanItem;
      const newStatusId = action.payload.newStatusId;
      const newPriority = action.payload.newPriority;

      const movedKanbanItem = state.data.kanban_items.find(
        (item) => item.kanban_item_uuid === kanbanItem.kanban_item_uuid,
      );

      if (movedKanbanItem) {
        movedKanbanItem.kanban_item_status_id = newStatusId;
        movedKanbanItem.kanban_item_priority = newPriority;
      }
    },
    reassignKanbanItem(state, action) {
      const kanbanItem = action.payload.kanbanItem;
      const newOwnerUuid = action.payload.newOwnerUuid;

      const reassignedKanbanItem = state.data.kanban_items.find(
        (item) => item.kanban_item_uuid === kanbanItem.kanban_item_uuid,
      );

      if (reassignedKanbanItem) {
        reassignedKanbanItem.kanban_item_owner_uuid = newOwnerUuid;
      }
    },
    renameKanbanItem(state, action) {
      const kanbanItem = action.payload.kanbanItem;
      const newItemTitle = action.payload.newItemTitle;

      const renamedKanbanItem = state.data.kanban_items.find(
        (item) => item.kanban_item_uuid === kanbanItem.kanban_item_uuid,
      );

      if (renamedKanbanItem) {
        renamedKanbanItem.kanban_item_details.item_title = newItemTitle;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKanbanItems.pending, (state, action) => {
        state.getError = false;
        state.isGetting = true;
      })
      .addCase(getKanbanItems.rejected, (state, { payload }) => {
        state.isLoaded = false;
        state.isGetting = false;
        state.getError = payload;
        console.error(`>> ${payload}`);
      })
      .addCase(getKanbanItems.fulfilled, (state, { payload }) => {
        state.isLoaded = true;
        state.isGetting = false;
        state.getError = false;
        state.data = payload || [];
      })
      .addCase(postKanbanItems.pending, (state, action) => {
        state.isPosting = true;
        state.postError = false;
        state.postSuccess = true;
      })
      .addCase(postKanbanItems.rejected, (state, { payload }) => {
        state.postError = payload;
        state.postSuccess = false;
        state.isPosting = false;
        console.error(`>> ${payload}`);
      })
      .addCase(postKanbanItems.fulfilled, (state, { payload }) => {
        state.isPosting = false;
        state.postSuccess = 'Kanban item updated';
      });
  },
});

export const { reducer } = slice;

export default slice;
