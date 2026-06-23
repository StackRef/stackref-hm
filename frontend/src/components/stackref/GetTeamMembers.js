import { stackrefConfig } from 'src/config';

export async function GetTeamMembers(user, teamUuid = '', ...other) {
  console.log(':: GetTeamMembers');

  const srAPIUrl = `${stackrefConfig.apiUrl}/teamMemberRead`;

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
      const error = new Error(`>> GetTeamMembers: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetTeamMembers: ${err}`);
    throw err;
  }
}

export default GetTeamMembers;
