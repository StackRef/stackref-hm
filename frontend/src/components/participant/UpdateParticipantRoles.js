import { stackrefConfig } from 'src/config';

export async function UpdateParticipantRoles(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/participantUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    participant: {
      participant_uuid: payload.participant_uuid,
      event_uuid: payload.event_uuid,
      participant_roles: payload.participant_roles,
    },
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(updatePayload),
  };

  try {
    await fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error('>> UpdateParticipantRoles fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UpdateParticipantRoles: ${error}`);
    _callback(null);
  }
}

export default UpdateParticipantRoles;
