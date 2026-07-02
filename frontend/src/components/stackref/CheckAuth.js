import { stackrefConfig } from 'src/config';

export async function CheckAuth(user) {
  console.log(':: CheckAuth');

  const srAPIUrl = `${stackrefConfig.apiUrl}/generateUUID`;

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
      const error = new Error(`>> CheckAuth: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  } catch (err) {
    console.error(`>> CheckAuth: ${err}`);
    throw err;
  }
}

export default CheckAuth;
