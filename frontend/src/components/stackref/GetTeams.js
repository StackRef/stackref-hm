import { stackrefConfig } from 'src/config';

export async function GetTeams(user, eventUuid = '', ...other) {
  console.log(':: GetTeams');

  const teamUuid = other;

  const srAPIUrl = `${stackrefConfig.apiUrl}/teamRead`;

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
      `${srAPIUrl}?event_uuid=${eventUuid}&team_uuid=${teamUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(
        `>> GetTeams: ${response.status} (${response.statusText})`,
      );
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetTeams: ${err}`);
    throw err;
  }
}

export default GetTeams;
