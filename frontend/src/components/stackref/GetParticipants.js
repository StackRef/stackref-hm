import { stackrefConfig } from 'src/config';

export async function GetParticipants(user, eventUuid = '', ...other) {
  console.log(':: GetParticipants');

  const srAPIUrl = `${stackrefConfig.apiUrl}/participantRead`;

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
  };

  try {
    const response = await fetch(
      `${srAPIUrl}?event_uuid=${eventUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetParticipants: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetParticipants: ${err}`);
    throw err;
  }
}

export default GetParticipants;
