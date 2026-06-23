import { stackrefConfig } from 'src/config';

export async function GetCloudAccount(user, ...other) {
  console.log(':: GetCloudAccount');

  const entityUuid = other || '';

  const srAPIUrl = `${stackrefConfig.apiUrl}/cloudAccountRead`;

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
      `${srAPIUrl}?entity_uuid=${entityUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetCloudAccount: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error(`>> GetCloudAccount: ${err}`);
    throw err;
  }
}

export default GetCloudAccount;
