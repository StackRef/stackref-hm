import { stackrefConfig } from '../../../config';

// TODO: Create class or object to contain Event payload

export async function ParticipantCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/participantCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    participant: {
      user_uuid: payload.user_uuid,
      event_uuid: payload.event_uuid,
      participant_role_id: payload.participant_role_id,
    },
  };

  console.log(':: ParticipantCreate: ' + JSON.stringify(createPayload));

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(createPayload),
  };

  try {
    await fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        console.log(':: ParticipantCreate JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .catch((error) => {
        console.error('>> ParticipantCreate fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> ParticipantCreate: ${error}`);
    _callback(null);
  }
}

export default ParticipantCreate;
