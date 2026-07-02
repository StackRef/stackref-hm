import { stackrefConfig } from 'src/config';

export async function GetOrgUsers(user) {
  console.log(':: GetOrgUsers');

  const srAPIUrl = `${stackrefConfig.apiUrl}/userRead`;

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
      `${srAPIUrl}?organization_uuid=${user.organization_uuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetOrgUsers: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetOrgUsers: ${err}`);
    throw err;
  }
}

export default GetOrgUsers;
