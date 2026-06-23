import { createContext, useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import useAuth from 'src/hooks/useAuth';
import ActivateAmznMktEntitlement from 'src/components/stackref/ActivateAmznMktEntitlement';
import UtilizeAmznMktEntitlement from 'src/components/stackref/UtilizeAmznMktEntitlement';
import GetEvents from 'src/components/stackref/GetEvents';
import GetUserParticipants from 'src/components/stackref/GetUserParticipants';
import GetParticipants from 'src/components/stackref/GetParticipants';
import GetTeams from 'src/components/stackref/GetTeams';
import GetJudgingCriteria from 'src/components/stackref/GetJudgingCriteria';
import GetOrgUsers from 'src/components/stackref/GetOrgUsers';
import GetTeamMembers from 'src/components/stackref/GetTeamMembers';
import GetResources from 'src/components/stackref/GetResources';
import GetOrgDetails from 'src/components/stackref/GetOrgDetails';
import GetEventActivity from 'src/components/stackref/GetEventActivity';

const initialState = {
  activeTeam: null,
  activeTeamMember: null,
  activeOrgEvent: null,
  eventActivity: [],
  judgingCriteria: [],
  organization: null,
  orgEvents: [],
  orgUsers: [],
  participant: null,
  participants: [],
  teamMembers: [],
  teamResources: [],
  teams: [],
  userParticipants: [],
};

const handlers = {
  INITIALIZE_TEAM_RESOURCES: (state, action) => {
    const { teamResources } = action.payload;

    return {
      ...state,
      teamResources,
    };
  },
  UPDATE_TEAM_RESOURCES: (state, action) => {
    const { teamResources } = action.payload;

    return {
      ...state,
      teamResources,
    };
  },
  INITIALIZE_ORG_EVENTS: (state, action) => {
    const { orgEvents } = action.payload;

    return {
      ...state,
      orgEvents,
    };
  },
  UPDATE_ORG_EVENTS: (state, action) => {
    const { orgEvents } = action.payload;

    return {
      ...state,
      orgEvents,
    };
  },
  REMOVE_FROM_ORG_EVENTS: (state, action) => {
    const eventUuid = action.payload;

    const newOrgEvents = state.orgEvents.filter(
      (orgEvent) => orgEvent.event_uuid !== eventUuid,
    );

    return {
      ...state,
      orgEvents: newOrgEvents,
    };
  },
  INITIALIZE_JUDGING_CRITERIA: (state, action) => {
    const { judgingCriteria } = action.payload;

    return {
      ...state,
      judgingCriteria,
    };
  },
  UPDATE_JUDGING_CRITERIA: (state, action) => {
    const { judgingCriteria } = action.payload;

    return {
      ...state,
      judgingCriteria,
    };
  },
  REMOVE_FROM_JUDGING_CRITERIA: (state, action) => {
    const judgingCriterionUuid = action.payload;

    const newCriteria = state.judgingCriteria.filter(
      (jc) => jc.judging_criterion_uuid !== judgingCriterionUuid,
    );

    return {
      ...state,
      judgingCriteria: newCriteria,
    };
  },
  CLEAR_JUDGING_CRITERIA: (state) => ({
    ...state,
    judgingCriteria: null,
  }),
  INITIALIZE_USER_PARTICIPANTS: (state, action) => {
    const { userParticipants } = action.payload;

    return {
      ...state,
      userParticipants,
    };
  },
  UPDATE_USER_PARTICIPANTS: (state, action) => {
    const { userParticipants } = action.payload;

    return {
      ...state,
      userParticipants,
    };
  },
  CLEAR_USER_PARTICIPANTS: (state) => ({
    ...state,
    userParticipants: null,
  }),
  SET_PARTICIPANT: (state, action) => {
    const participant = action.payload;

    return {
      ...state,
      participant: participant,
    };
  },
  CLEAR_PARTICIPANT: (state) => ({
    ...state,
    participant: null,
  }),
  SET_ACTIVE_ORG_EVENT: (state, action) => {
    const { activeOrgEvent } = action.payload;

    return {
      ...state,
      activeOrgEvent,
    };
  },
  CLEAR_ACTIVE_ORG_EVENT: (state) => ({
    ...state,
    activeOrgEvent: null,
  }),
  SET_ACTIVE_TEAM: (state, action) => {
    const { activeTeam } = action.payload;

    return {
      ...state,
      activeTeam,
    };
  },
  SET_ACTIVE_TEAM_MEMBER: (state, action) => {
    const { activeTeamMember } = action.payload;

    return {
      ...state,
      activeTeamMember,
    };
  },
  CLEAR_ACTIVE_TEAM: (state) => ({
    ...state,
    activeTeam: null,
  }),
  INITIALIZE_PARTICIPANTS: (state, action) => {
    const { participants } = action.payload;

    return {
      ...state,
      participants,
    };
  },
  UPDATE_PARTICIPANTS: (state, action) => {
    const { participants } = action.payload;

    return {
      ...state,
      participants,
    };
  },
  REMOVE_FROM_PARTICIPANTS: (state, action) => {
    const participantUuid = action.payload;

    const newParticipants = state.participants.filter(
      (participant) => participant.participant_uuid !== participantUuid,
    );

    return {
      ...state,
      participants: newParticipants,
    };
  },
  CLEAR_PARTICIPANTS: (state) => ({
    ...state,
    participants: null,
  }),
  INITIALIZE_TEAMS: (state, action) => {
    const { teams } = action.payload;

    return {
      ...state,
      teams,
    };
  },
  UPDATE_TEAMS: (state, action) => {
    const { teams } = action.payload;

    return {
      ...state,
      teams,
    };
  },
  REMOVE_FROM_TEAMS: (state, action) => {
    const teamUuid = action.payload;

    const newTeams = state.teams.filter((team) => team.team_uuid !== teamUuid);

    return {
      ...state,
      teams: newTeams,
    };
  },
  CLEAR_TEAMS: (state) => ({
    ...state,
    teams: null,
  }),
  INITIALIZE_TEAM_MEMBERS: (state, action) => {
    const { teamMembers } = action.payload;

    return {
      ...state,
      teamMembers,
    };
  },
  UPDATE_TEAM_MEMBERS: (state, action) => {
    const { teamMembers } = action.payload;

    return {
      ...state,
      teamMembers,
    };
  },
  REMOVE_FROM_TEAM_MEMBERS: (state, action) => {
    const teamMemberUuid = action.payload;

    const newTeamMembers = state.teamMembers.filter(
      (tm) => tm.team_member_uuid !== teamMemberUuid,
    );

    return {
      ...state,
      teamMembers: newTeamMembers,
    };
  },
  CLEAR_TEAM_MEMBERS: (state) => ({
    ...state,
    teamMembers: null,
  }),
  INITIALIZE_ORG_USERS: (state, action) => {
    const { orgUsers } = action.payload;

    return {
      ...state,
      orgUsers,
    };
  },
  UPDATE_ORG_USERS: (state, action) => {
    const { orgUsers } = action.payload;

    return {
      ...state,
      orgUsers,
    };
  },
  REMOVE_FROM_ORG_USERS: (state, action) => {
    const userUuid = action.payload;

    const newOrgUsers = state.orgUsers.filter(
      (orgUser) => orgUser.user_uuid !== userUuid,
    );

    return {
      ...state,
      orgUsers: newOrgUsers,
    };
  },
  CLEAR_ORG_USERS: (state) => ({
    ...state,
    orgUsers: null,
  }),
  INITIALIZE_ORGANIZATION: (state, action) => {
    const { organization } = action.payload;

    return {
      ...state,
      organization,
    };
  },
  UPDATE_ORGANIZATION: (state, action) => {
    const { organization } = action.payload;

    return {
      ...state,
      organization,
    };
  },
  INITIALIZE_EVENT_ACTIVITY: (state, action) => {
    const { eventActivity } = action.payload;

    return {
      ...state,
      eventActivity,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

const StackRefContext = createContext({
  ...initialState,
  initializeOrgEvents: () => Promise.resolve(),
  removeFromOrgEvents: () => Promise.resolve(),
  clearOrgEvents: () => Promise.resolve(),
  initializeUserParticipants: () => Promise.resolve(),
  clearUserParticipants: () => Promise.resolve(),
  initializeParticipants: () => Promise.resolve(),
  removeFromParticipants: () => Promise.resolve(),
  clearParticipants: () => Promise.resolve(),
  initializeTeams: () => Promise.resolve(),
  updateTeams: () => Promise.resolve(),
  removeFromTeams: () => Promise.resolve(),
  clearTeams: () => Promise.resolve(),
  initializeTeamMembers: () => Promise.resolve(),
  removeFromTeamMembers: () => Promise.resolve(),
  clearTeamMembers: () => Promise.resolve(),
  initializeOrgUsers: () => Promise.resolve(),
  updateOrgUsers: () => Promise.resolve(),
  removeFromOrgUsers: () => Promise.resolve(),
  clearOrgUsers: () => Promise.resolve(),
  initializeJudgingCriteria: () => Promise.resolve(),
  updateJudgingCriteria: () => Promise.resolve(),
  removeFromJudgingCriteria: () => Promise.resolve(),
  clearJudgingCriteria: () => Promise.resolve(),
  initializeTeamResources: () => Promise.resolve(),
  initializeOrganization: () => Promise.resolve(),
  clearParticipant: () => Promise.resolve(),
  clearOrgEvent: () => Promise.resolve(),
  setActiveTeam: () => Promise.resolve(),
  setActiveTeamMember: () => Promise.resolve(),
  clearActiveTeam: () => Promise.resolve(),
  initializeEventActivity: () => Promise.resolve(),
});

export const StackRefProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isAuthenticated, logout, user } = useAuth();

  const setParticipant = useCallback(() => {
    console.log(':: setParticipant');
    dispatch({
      type: 'SET_PARTICIPANT',
      payload: state.userParticipants?.find((p) => p.is_active),
    });
  }, [state.userParticipants]);

  const setActiveOrgEvent = useCallback(() => {
    console.log(':: setActiveOrgEvent');
    dispatch({
      type: 'SET_ACTIVE_ORG_EVENT',
      payload: {
        activeOrgEvent: state.orgEvents?.find(
          (orgEvent) =>
            orgEvent.event_uuid ===
              state.userParticipants?.find((p) => p.is_active)?.event_uuid &&
            (orgEvent.event_status_name === 'Running' ||
              orgEvent.event_status_name === 'Judging'),
        ),
      },
    });
  }, [state.orgEvents, state.userParticipants]);

  const setActiveTeam = useCallback(async () => {
    console.log(':: setActiveTeam');
    if (
      !user ||
      !state.activeOrgEvent?.event_uuid ||
      !state.participant?.participant_teams?.[0]?.team_uuid
    ) {
      dispatch({
        type: 'SET_ACTIVE_TEAM',
        payload: { activeTeam: null },
      });
    } else {
      try {
        await GetTeams(
          user,
          state.activeOrgEvent.event_uuid,
          state.participant.participant_teams[0].team_uuid,
        )
          .then((data) => {
            dispatch({
              type: 'SET_ACTIVE_TEAM',
              payload: { activeTeam: data?.[0] },
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> setActiveTeam: ${err}`);
        dispatch({
          type: 'SET_ACTIVE_TEAM',
          payload: { activeTeam: null },
        });
        if (err.status === 401) logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeOrgEvent, state.participant, user]);

  const setActiveTeamMember = useCallback(() => {
    console.log(':: setActiveTeamMember');
    dispatch({
      type: 'SET_ACTIVE_TEAM_MEMBER',
      payload: {
        activeTeamMember: state.teamMembers?.find(
          (tm) => tm.participant_uuid === state.participant?.participant_uuid,
        ),
      },
    });
  }, [state.participant, state.teamMembers]);

  // Register/utilize Amazon Marketplace Entitlement
  useEffect(() => {
    async function initialize() {
      if (user?.user_role_grants?.includes('organization_write')) {
        try {
          let storedAmznToken = window.localStorage.getItem(
            'amznMarketplaceToken',
          );

          if (storedAmznToken) {
            await ActivateAmznMktEntitlement(user, storedAmznToken);
            window.localStorage.removeItem('amznMarketplaceToken');
          }

          const payload = { user: user };

          await UtilizeAmznMktEntitlement(payload, (response) => {
            if (
              !response ||
              (response.status_code !== 200 && response.status_code !== 204)
            )
              throw new Error(
                `${
                  response?.error
                    ? response.error
                    : 'There was a problem processing your Amazon Marketplace entitlement'
                }`,
              );
            if (response.status_code === 204) {
              console.log(':: All active entitlements in use');
            }
            if (response.status_code === 200) {
              console.log(
                `:: Entitlement processed: ${response.transaction_value} StackCash added`,
              );
            }
          }).catch((err) => {
            throw err;
          });
        } catch (err) {
          console.error(`>> ${err}`);
        }
      }
    }
    initialize();
  }, [user]);

  const initializeOrganization = useCallback(async () => {
    console.log(':: initializeOrganization');

    if (isAuthenticated && user?.organization_uuid) {
      try {
        await GetOrgDetails(user)
          .then((data) => {
            dispatch({
              type: 'INITIALIZE_ORGANIZATION',
              payload: { organization: data },
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> initializeOrganization: ${err}`);
        if (err.status === 401) logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const initializeTeamResources = async (eventUuid) => {
    console.log(':: initializeTeamResources');

    try {
      await GetResources(user, eventUuid)
        .then((data) => {
          dispatch({
            type: 'INITIALIZE_TEAM_RESOURCES',
            payload: { teamResources: data },
          });
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.error(`>> initializeTeamResources: ${err}`);
      if (err.status === 401) logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  const initializeOrgEvents = useCallback(async () => {
    console.log(':: initializeOrgEvents');

    if (isAuthenticated && user?.organization_uuid) {
      try {
        await GetEvents(user)
          .then((data) => {
            dispatch({
              type: 'INITIALIZE_ORG_EVENTS',
              payload: { orgEvents: data },
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> initializeOrgEvents: ${err}`);
        if (err.status === 401) logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const initializeUserParticipants = useCallback(async () => {
    console.log(':: initializeUserParticipants');

    if (isAuthenticated && user?.organization_uuid) {
      try {
        await GetUserParticipants(user)
          .then((data) => {
            dispatch({
              type: 'INITIALIZE_USER_PARTICIPANTS',
              payload: { userParticipants: data },
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> initializeUserParticipants: ${err}`);
        if (err.status === 401) logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const removeFromOrgEvents = (eventUuid) => {
    console.log(':: removeFromOrgEvents');
    dispatch({
      type: 'REMOVE_FROM_ORG_EVENTS',
      payload: eventUuid,
    });
  };

  const clearOrgEvents = () => {
    console.log(':: clearOrgEvents');
    dispatch({
      type: 'CLEAR_ORG_EVENTS',
    });
  };

  const clearActiveTeam = () => {
    console.log(':: clearActiveTeam');
    dispatch({
      type: 'SET_ACTIVE_TEAM',
      payload: { activeTeam: null },
    });
  };

  const initializeJudgingCriteria = useCallback(
    async (eventUuid) => {
      console.log(':: initializeJudgingCriteria');

      const thisEventUuid = eventUuid || state.activeOrgEvent?.event_uuid;

      if (thisEventUuid) {
        try {
          await GetJudgingCriteria(user, thisEventUuid)
            .then((data) => {
              dispatch({
                type: 'INITIALIZE_JUDGING_CRITERIA',
                payload: { judgingCriteria: data },
              });
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          console.error(`>> initializeJudgingCriteria: ${err}`);
          if (err.status === 401) logout();
        }
      } else {
        clearJudgingCriteria();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activeOrgEvent?.event_uuid, user],
  );

  const updateJudgingCriteria = (judgingCriteria) => {
    console.log(':: updateJudgingCriteria');
    dispatch({
      type: 'UPDATE_JUDGING_CRITERIA',
      payload: { judgingCriteria: judgingCriteria },
    });
  };

  const removeFromJudgingCriteria = (judgingCriterionUuid) => {
    console.log(':: removeFromJudgingCriteria');
    dispatch({
      type: 'REMOVE_FROM_JUDGING_CRITERIA',
      payload: judgingCriterionUuid,
    });
  };

  const clearJudgingCriteria = () => {
    console.log(':: clearJudgingCriteria');
    dispatch({
      type: 'CLEAR_JUDGING_CRITERIA',
    });
  };

  const clearUserParticipants = () => {
    console.log(':: clearUserParticipants');
    dispatch({
      type: 'CLEAR_USER_PARTICIPANTS',
    });
  };

  const initializeParticipants = useCallback(
    async (eventUuid) => {
      console.log(':: initializeParticipants');

      const thisEventUuid = eventUuid || state.activeOrgEvent?.event_uuid;

      if (thisEventUuid) {
        try {
          await GetParticipants(user, thisEventUuid)
            .then((data) => {
              dispatch({
                type: 'INITIALIZE_PARTICIPANTS',
                payload: { participants: data },
              });
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          console.error(`>> initializeParticipants: ${err}`);
          if (err.status === 401) logout();
        }
      } else {
        clearParticipants();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const removeFromParticipants = async (participantUuid) => {
    console.log(':: removeFromParticipants');
    dispatch({
      type: 'REMOVE_FROM_PARTICIPANTS',
      payload: participantUuid,
    });
  };

  const clearParticipants = async () => {
    console.log(':: clearParticipants');
    dispatch({
      type: 'CLEAR_PARTICIPANTS',
    });
  };

  const initializeTeams = useCallback(
    async (eventUuid) => {
      console.log(':: initializeTeams');

      const thisEventUuid = eventUuid || state.activeOrgEvent?.event_uuid;

      if (thisEventUuid) {
        try {
          await GetTeams(user, thisEventUuid)
            .then((data) => {
              dispatch({
                type: 'INITIALIZE_TEAMS',
                payload: { teams: data },
              });
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          console.error(`>> initializeTeams: ${err}`);
          if (err.status === 401) logout();
        }
      } else {
        clearTeams();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, state.activeOrgEvent],
  );

  const updateTeams = async (teams) => {
    console.log(':: updateTeams');
    dispatch({
      type: 'UPDATE_TEAMS',
      payload: { teams: teams },
    });
  };

  const removeFromTeams = async (teamUuid) => {
    console.log(':: removeFromTeams');
    dispatch({
      type: 'REMOVE_FROM_TEAMS',
      payload: teamUuid,
    });
  };

  const clearTeams = async (options) => {
    console.log(':: clearTeams');
    dispatch({
      type: 'CLEAR_TEAMS',
    });
  };

  const initializeTeamMembers = useCallback(
    async (teamUuid) => {
      console.log(':: initializeTeamMembers');

      const thisTeamUuid = teamUuid || state.activeTeam?.team_uuid;

      if (thisTeamUuid) {
        try {
          await GetTeamMembers(user, thisTeamUuid)
            .then((data) => {
              dispatch({
                type: 'INITIALIZE_TEAM_MEMBERS',
                payload: { teamMembers: data },
              });
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          console.error(`>> initializeTeamMembers: ${err}`);
          dispatch({
            type: 'CLEAR_TEAM_MEMBERS',
          });
          if (err.status === 401) logout();
        }
      } else {
        clearTeamMembers();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activeTeam, user],
  );

  useEffect(() => {
    initializeOrganization();
  }, [initializeOrganization]);

  useEffect(() => {
    initializeOrgEvents();
  }, [initializeOrgEvents]);

  useEffect(() => {
    initializeUserParticipants();
  }, [initializeUserParticipants]);

  useEffect(() => {
    setParticipant();
  }, [setParticipant]);

  useEffect(() => {
    setActiveOrgEvent();
  }, [setActiveOrgEvent]);

  useEffect(() => {
    initializeTeams();
  }, [initializeTeams]);

  useEffect(() => {
    setActiveTeam();
  }, [setActiveTeam]);

  useEffect(() => {
    initializeTeamMembers();
  }, [initializeTeamMembers]);

  useEffect(() => {
    setActiveTeamMember();
  }, [setActiveTeamMember]);

  const removeFromTeamMembers = (teamMemberUuid) => {
    console.log(':: removeFromTeamMembers');
    dispatch({
      type: 'REMOVE_FROM_TEAM_MEMBERS',
      payload: teamMemberUuid,
    });
  };

  const clearTeamMembers = () => {
    console.log(':: clearTeamMembers');
    dispatch({
      type: 'CLEAR_TEAM_MEMBERS',
    });
  };

  const initializeOrgUsers = useCallback(async () => {
    console.log(':: initializeOrgUsers');

    try {
      await GetOrgUsers(user)
        .then((data) => {
          dispatch({
            type: 'INITIALIZE_ORG_USERS',
            payload: { orgUsers: data },
          });
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.error(`>> initializeOrgUsers: ${err}`);
      if (err.status === 401) logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateOrgUsers = (orgUsers) => {
    console.log(':: updateOrgUsers');
    dispatch({
      type: 'UPDATE_ORG_USERS',
      payload: { orgUsers: orgUsers },
    });
  };

  const removeFromOrgUsers = (userUuid) => {
    console.log(':: removeFromOrgUsers');
    dispatch({
      type: 'REMOVE_FROM_ORG_USERS',
      payload: userUuid,
    });
  };

  const clearOrgUsers = (options) => {
    console.log(':: clearOrgUsers');
    dispatch({
      type: 'CLEAR_ORG_USERS',
    });
  };

  const clearEventActivity = (options) => {
    console.log(':: clearEventActivity');
    dispatch({
      type: 'INITIALIZE_EVENT_ACTIVITY',
      payload: { eventActivity: null },
    });
  };

  const initializeEventActivity = useCallback(
    async (eventUuid) => {
      console.log(':: initializeEventActivity');

      const thisEventUuid = eventUuid || state.activeOrgEvent?.event_uuid;

      if (thisEventUuid) {
        try {
          await GetEventActivity(user, thisEventUuid)
            .then((data) => {
              dispatch({
                type: 'INITIALIZE_EVENT_ACTIVITY',
                payload: { eventActivity: data },
              });
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          console.error(`>> initializeEventActivity: ${err}`);
          if (err.status === 401) logout();
        }
      } else {
        clearEventActivity();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activeOrgEvent, user],
  );

  return (
    <StackRefContext.Provider
      value={{
        ...state,
        initializeOrgEvents,
        removeFromOrgEvents,
        clearOrgEvents,
        initializeUserParticipants,
        clearUserParticipants,
        initializeParticipants,
        removeFromParticipants,
        clearParticipants,
        initializeTeamMembers,
        removeFromTeamMembers,
        clearTeamMembers,
        initializeTeams,
        updateTeams,
        removeFromTeams,
        clearTeams,
        initializeOrgUsers,
        updateOrgUsers,
        removeFromOrgUsers,
        clearOrgUsers,
        initializeJudgingCriteria,
        updateJudgingCriteria,
        removeFromJudgingCriteria,
        clearJudgingCriteria,
        initializeTeamResources,
        initializeOrganization,
        setActiveTeam,
        setActiveTeamMember,
        initializeEventActivity,
      }}
    >
      {children}
    </StackRefContext.Provider>
  );
};

StackRefProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StackRefContext;
