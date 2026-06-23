import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import useAuth from 'src/hooks/useAuth';
import useNotifications from 'src/hooks/useNotifications';
import useStackRef from 'src/hooks/useStackRef';
import useWebSocket from 'src/hooks/useWebSocket';
import { stackrefConfig } from 'src/config';
import useIsMountedRef from 'use-is-mounted-ref';
import { useDispatch } from 'src/store';
import { setNotifications, addNotification } from 'src/slices/notifications';
import { getKanbanItems } from 'src/slices/kanban';
import { getOrgInvitations } from 'src/slices/orgInvitations';

import CloudCircleRoundedIcon from '@mui/icons-material/CloudCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';

const iconsMap = {
  game_time: <ScheduleRoundedIcon />,
  new_message: <MessageRoundedIcon />,
  event_status: <EventAvailableRoundedIcon />,
  team_status: <Groups2RoundedIcon />,
  judging_status: <GavelRoundedIcon />,
  resource_created: <SettingsRoundedIcon />,
  resource_terminated: <SettingsRoundedIcon />,
  cloud_account: <CloudCircleRoundedIcon />,
  kanban: <ViewKanbanRoundedIcon />,
};

const TatorMessaging = () => {
  const { socket, joinedRooms, addRoom, removeRoom } = useWebSocket();
  const { logout, user } = useAuth();
  const isMountedRef = useIsMountedRef();
  const dispatch = useDispatch();
  const { saveNotifications, addStoredNotification } = useNotifications();
  const {
    activeOrgEvent,
    activeTeam,
    initializeEventActivity,
    initializeJudgingCriteria,
    initializeOrgEvents,
    initializeOrganization,
    initializeOrgUsers,
    initializeParticipants,
    initializeTeamMembers,
    initializeTeamResources,
    initializeTeams,
    initializeUserParticipants,
    setActiveTeam,
    setActiveTeamMember,
  } = useStackRef();

  const initializeKanban = () => {
    if (activeTeam)
      dispatch(getKanbanItems({ user: user, team_uuid: activeTeam.team_uuid }));
  };

  const initializeOrgInvitations = () => {
    dispatch(getOrgInvitations({ user: user }));
  };

  const messageListener = (event) => {
    const commandFunctions = {
      initializeKanban,
      initializeEventActivity,
      initializeJudgingCriteria,
      initializeOrganization,
      initializeOrgEvents,
      initializeOrgInvitations,
      initializeOrgUsers,
      initializeParticipants,
      initializeTeamMembers,
      initializeTeamResources,
      initializeTeams,
      initializeUserParticipants,
      logout,
      setActiveTeam,
      setActiveTeamMember,
    };

    if (event.origin === stackrefConfig.wsBase) {
      const data = JSON.parse(event.data);
      if (data.command) {
        console.log(`:: command: ${data.command}`);
        const commandFunction = commandFunctions[data.command];
        const commandArgs = data.args;
        if (typeof commandFunction === 'function') {
          commandFunction(commandArgs);
        } else {
          console.error(`Function "${data.command}" not found`);
        }
      } else if (data.message) {
        console.log(`:: message: ${data.message}`);
        if (
          data.message !== 'pong' &&
          data.message !== 'Endpoint request timed out' &&
          document.visibilityState === 'visible'
        ) {
          // TODO: Listen for successful/failed room joins and add/remove them from the array here
          toast(`${data.message}`, {
            containerId: 'notifications',
            icon: data.type ? iconsMap[data.type] : <InfoRoundedIcon />,
          });
        }
      } else if (data.notifications) {
        dispatch(setNotifications(data.notifications));
        saveNotifications(data.notifications);
      } else if (data.notification?.content) {
        const content = JSON.parse(data.notification.content);
        if (content?.title) {
          if (document.visibilityState === 'visible') {
            toast(`${content.title}`, {
              containerId: 'notifications',
              type: content.status || 'info',
              icon: content.type ? (
                iconsMap[content.type]
              ) : (
                <CircleNotificationsRoundedIcon />
              ),
            });
          }
          dispatch(addNotification(data.notification));
          addStoredNotification(data.notification);
        }
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    console.log(':: Adding tator eventListener');
    socket.addEventListener('message', messageListener);

    return () => {
      console.log(':: Removing tator event listener');
      socket.removeEventListener('message', messageListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const sendGetNotifications = useCallback(() => {
    if (socket?.readyState === 1 && joinedRooms) {
      try {
        socket.send(`{
          "action": "get",
          "item": "notifications"
        }`);
      } catch (error) {
        console.error(`>> sendGetNotifications: ${error}`);
      }
    }
  }, [socket, joinedRooms]);

  useEffect(() => {
    sendGetNotifications();
  }, [sendGetNotifications]);

  const sendOrgRoomJoin = useCallback(() => {
    if (socket?.readyState === 1) {
      if (
        user.organization_uuid &&
        !joinedRooms.find((room) => room.roomUuid === user.organization_uuid)
      ) {
        try {
          socket.send(`{
            "action": "join",
            "user_uuid": "${user.user_uuid}",
            "room_uuid": "${user.organization_uuid}"
          }`);
          addRoom(user.organization_uuid, 'Organization channel');
        } catch (error) {
          console.error(`>> sendOrgRoomJoin: ${error}`);
        }
      }
    }
  }, [socket, joinedRooms, user, addRoom]);

  useEffect(() => {
    sendOrgRoomJoin();
  }, [sendOrgRoomJoin]);

  const sendEventRoomJoin = useCallback(() => {
    if (socket?.readyState === 1) {
      if (!activeOrgEvent) {
        const oldEvent = joinedRooms.find(
          (room) => room.roomName === 'Event channel',
        );
        if (oldEvent) {
          try {
            socket.send(`{
              "action": "leave",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${oldEvent.roomUuid}"
            }`);
            removeRoom(oldEvent.roomUuid);
          } catch (error) {
            console.error(`>> sendEventRoomJoin: ${error}`);
          }
        }
      } else {
        const oldEvent = joinedRooms.find(
          (room) => room.roomName === 'Event channel',
        );
        if (
          oldEvent &&
          ((!activeOrgEvent && oldEvent?.roomUuid) ||
            oldEvent?.roomUuid !== activeOrgEvent?.event_uuid)
        ) {
          try {
            socket.send(`{
              "action": "leave",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${oldEvent.roomUuid}"
            }`);
            removeRoom(oldEvent.roomUuid);
          } catch (error) {
            console.error(`>> sendEventRoomJoin: ${error}`);
          }
        }
        if (
          !joinedRooms.find(
            (room) => room.roomUuid === activeOrgEvent.event_uuid,
          )
        ) {
          try {
            socket.send(`{
              "action": "join",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${activeOrgEvent.event_uuid}"
            }`);
            addRoom(activeOrgEvent.event_uuid, 'Event channel');
          } catch (error) {
            console.error(`>> sendEventRoomJoin: ${error}`);
          }
        }
      }
    }
  }, [
    socket,
    joinedRooms,
    activeOrgEvent,
    user.user_uuid,
    removeRoom,
    addRoom,
  ]);

  useEffect(() => {
    sendEventRoomJoin();
  }, [sendEventRoomJoin]);

  const sendTeamRoomJoin = useCallback(() => {
    if (socket?.readyState === 1 && isMountedRef.current) {
      if (!activeTeam) {
        const oldTeam = joinedRooms.find(
          (room) => room.roomName === 'Team channel',
        );
        if (oldTeam) {
          try {
            socket.send(`{
              "action": "leave",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${oldTeam.roomUuid}"
            }`);
            removeRoom(oldTeam.roomUuid);
          } catch (error) {
            console.error(`>> sendTeamRoomJoin: ${error}`);
          }
        }
      } else {
        const oldTeam = joinedRooms.find(
          (room) => room.roomName === 'Team channel',
        );
        if (
          oldTeam &&
          ((!activeTeam && oldTeam?.roomUuid) ||
            oldTeam?.roomUuid !== activeTeam?.team_uuid)
        ) {
          try {
            socket.send(`{
              "action": "leave",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${oldTeam.roomUuid}"
            }`);
            removeRoom(oldTeam.roomUuid);
          } catch (error) {
            console.error(`>> sendTeamRoomJoin: ${error}`);
          }
        }
        if (
          !joinedRooms.find((room) => room.roomUuid === activeTeam.team_uuid)
        ) {
          try {
            socket.send(`{
              "action": "join",
              "user_uuid": "${user.user_uuid}",
              "room_uuid": "${activeTeam.team_uuid}"
            }`);
            addRoom(activeTeam.team_uuid, 'Team channel');
          } catch (error) {
            console.error(`>> sendTeamRoomJoin: ${error}`);
          }
        }
      }
    }
  }, [
    isMountedRef,
    socket,
    joinedRooms,
    activeTeam,
    user.user_uuid,
    removeRoom,
    addRoom,
  ]);

  useEffect(() => {
    sendTeamRoomJoin();
  }, [sendTeamRoomJoin]);
};

export default TatorMessaging;
