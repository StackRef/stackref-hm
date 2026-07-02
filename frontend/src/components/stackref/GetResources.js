import { stackrefConfig } from 'src/config';

export async function GetResources(user, ...other) {
  console.log(':: GetResources');

  const eventUuid = other || '';

  const srAPIUrl = `${stackrefConfig.apiUrl}/resources`;

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
      `${srAPIUrl}?organization_uuid=${user.organization_uuid}&event_uuid=${eventUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetResources: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetResources: ${err}`);
    throw err;
  }
}

export default GetResources;
