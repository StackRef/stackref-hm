import { stackrefConfig } from 'src/config';

export async function GetUser(user, token) {
  console.log(':: GetUser');

  const srAPIUrl = `${stackrefConfig.apiUrl}/getUser`;

  const payload = {
    user: {
      user_uuid: user['https://acme.example.com/sr-user-uuid'],
    },
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(srAPIUrl, requestOptions);

    if (!response.ok) {
      const error = new Error(`>> GetUser: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetUser: ${err}`);
    throw err;
  }
}

export default GetUser;
