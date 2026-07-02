import { stackrefConfig } from 'src/config';

export async function GetUserParticipants(user) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/participantRead`;

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
  };

  try {
    const response = await fetch(
      `${srAPIUrl}?user_uuid=${user.user_uuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetUserParticipants: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetUserParticipants: ${err}`);
    throw err;
  }
}

export default GetUserParticipants;
