import { stackrefConfig } from 'src/config';

export async function GetKanban(user, teamUuid) {
  console.log(':: GetKanban');

  const srAPIUrl = `${stackrefConfig.apiUrl}/kanbanRead`;

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
      `${srAPIUrl}?team_uuid=${teamUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetKanban: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetKanban: ${err}`);
    throw err;
  }
}

export default GetKanban;
