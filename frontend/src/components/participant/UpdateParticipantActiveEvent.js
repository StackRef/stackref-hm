import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function UpdateParticipantActiveEvent(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/participantUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    participant: {
      event_uuid: payload.participant_uuid,
      participant_uuid: payload.participant_uuid,
    },
  };

  console.log(':: ParticipantEdit: ' + JSON.stringify(updatePayload));

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
        console.error('>> ParticipantEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> ParticipantEdit: ${error}`);
    _callback(null);
  }
}

export default UpdateParticipantActiveEvent;
