import { stackrefConfig } from 'src/config';

export async function GetOrgDetails(user) {
  console.log(':: GetOrgDetails');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationRead`;

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
      const error = new Error(`>> GetOrgDetails: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error(`>> GetOrgDetails: ${err}`);
    throw err;
  }
}

export default GetOrgDetails;
