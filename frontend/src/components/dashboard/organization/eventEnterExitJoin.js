import { toast } from 'react-toastify';
import ParticipantEdit from 'src/components/participant/ParticipantEdit';
import ParticipantCreate from 'src/components/dashboard/admin/ParticipantCreate';

export const handleEnterEvent = async (props) => {
  const { user, orgEvent, activeOrgEvent, userParticipants } = props;

  /*
  if (activeOrgEvent?.event_uuid) { // Leave the existing event first
    toast.success(`Left old event: ${activeOrgEvent.event_details?.event_name}`, {containerId: 'results'});
  }
  */

  const payload = {};
  payload['user'] = user;
  payload['action'] = 'set_active_event';
  payload['event_uuid'] = orgEvent.event_uuid;
  payload['participant_uuid'] = userParticipants?.find(
    (participant) => participant.event_uuid === orgEvent.event_uuid,
  )?.participant_uuid;

  try {
    await ParticipantEdit(payload, (response) => {
      if (!response || response.status_code !== 200)
        throw new Error('Set active Event failed');
    })
      .then(() => {
        toast.success(`Entered event: ${orgEvent.event_details.event_name}`, {
          containerId: 'results',
          toastId: new Date().getTime().toString() + Math.random(),
        });
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    console.error(`>> handleEnterEvent: ${error}`);
  }
};

export const handleExitEvent = async (props) => {
  const { user, orgEvent, userParticipants } = props;

  const payload = {};
  payload['user'] = user;
  payload['action'] = 'set_active_event';
  payload['participant_uuid'] = userParticipants?.find(
    (participant) => participant.event_uuid === orgEvent.event_uuid,
  )?.participant_uuid;

  try {
    await ParticipantEdit(payload, (response) => {
      if (!response || response.status_code !== 200)
        throw new Error('Unset active Event failed');
    })
      .then(() => {
        toast.success(`Left event: ${orgEvent.event_details.event_name}`, {
          containerId: 'results',
        });
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    console.error(`>> handleExitEvent: ${error}`);
  }
};

export const handleRequestToJoin = async (props) => {
  const { user, orgEvent } = props;

  const payload = {
    user: user,
    action: 'request_attend',
    user_uuid: user.user_uuid,
    event_uuid: orgEvent.event_uuid,
  };
  try {
    await ParticipantCreate(payload, (response) => {
      if (!response || response.status_code !== 200)
        throw new Error('Request failed');
    })
      .then(() => {
        toast.success(
          `Sent request to join '${orgEvent.event_details.event_name}'`,
          { containerId: 'results' },
        );
      })
      .catch((error) => {
        toast.error(error.message, { containerId: 'results' });
        throw error;
      });
  } catch (error) {
    console.error(`>> handleRequestToJoin: ${error}`);
  }
};
