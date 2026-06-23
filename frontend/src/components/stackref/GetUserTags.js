import { stackrefConfig } from 'src/config';

export async function GetUserTags(user, ...other) {
  console.log(':: GetUserTags');

  const srAPIUrl = `${stackrefConfig.apiUrl}/userTagRead`;

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
    const response = await fetch(srAPIUrl, requestOptions);

    if (!response.ok) {
      const error = new Error(`>> GetUserTags: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetUserTags: ${err}`);
    throw err;
  }
}

export default GetUserTags;
