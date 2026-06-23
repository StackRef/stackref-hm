import { stackrefConfig } from 'src/config';

export async function GetTeamScoreItems(user, teamUuid = '', ...other) {
  console.log(':: GetTeamScoreItems');

  const srAPIUrl = `${stackrefConfig.apiUrl}/teamScoreItemRead`;

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
      const error = new Error(`>> GetTeamScoreItems: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetTeamScoreItems: ${err}`);
    throw err;
  }
}

export default GetTeamScoreItems;
