import { stackrefConfig } from 'src/config';

export async function GetEventActivity(
  user,
  eventUuid,
  offset = 0,
  count = 25,
) {
  console.log(':: GetEventActivity');

  const srAPIUrl = `${stackrefConfig.apiUrl}/eventRead`;

  const action = `event_activity-${offset}-${count}`;

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
      `${srAPIUrl}?event_uuid=${eventUuid}&action=${action}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetEventActivity: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetEventActivity: ${err}`);
    throw err;
  }
}

export default GetEventActivity;
