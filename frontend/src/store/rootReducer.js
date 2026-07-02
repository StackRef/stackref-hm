import { combineReducers } from '@reduxjs/toolkit';
import { reducer as calendarReducer } from 'src/slices/calendar';
import { reducer as kanbanReducer } from 'src/slices/kanban';
import { reducer as teamScoreItemsReducer } from 'src/slices/teamScoreItems';
import { reducer as notificationsReducer } from 'src/slices/notifications';
import { reducer as orgEventReducer } from 'src/slices/orgEvent';
import { reducer as orgInvitationsReducer } from 'src/slices/orgInvitations';
import { reducer as participantsReducer } from 'src/slices/participants';
import { reducer as teamsReducer } from 'src/slices/teams';
import { reducer as judgingCriteriaReducer } from 'src/slices/judgingCriteria';

const rootReducer = combineReducers({
  calendar: calendarReducer,
  kanban: kanbanReducer,
  notifications: notificationsReducer,
  teamScoreItems: teamScoreItemsReducer,
  orgEvent: orgEventReducer,
  orgInvitations: orgInvitationsReducer,
  participants: participantsReducer,
  teams: teamsReducer,
  judgingCriteria: judgingCriteriaReducer,
});

export default rootReducer;
