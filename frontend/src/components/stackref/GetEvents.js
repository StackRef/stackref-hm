import { stackrefConfig } from 'src/config';

export async function GetEvents(user, eventUuid = '', action = '') {
  console.log(':: GetEvents');

  const srAPIUrl = `${stackrefConfig.apiUrl}/eventRead`;

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
      `${srAPIUrl}?organization_uuid=${user.organization_uuid}&event_uuid=${eventUuid}&action=${action}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetEvents: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetEvents: ${err}`);
    throw err;
  }
}

export default GetEvents;
