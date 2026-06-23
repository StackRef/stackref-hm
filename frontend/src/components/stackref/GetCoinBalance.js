import { stackrefConfig } from 'src/config';

export async function GetCoinBalance(user, ...other) {
  console.log(':: GetCoinBalance');

  const entityUuid = other || '';

  const srAPIUrl = `${stackrefConfig.apiUrl}/coinBankRead`;

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
      const error = new Error(`>> GetCoinBalance: ${response.status}`);
      error.status = response.status;
      throw error;
    } else if (response.status === 204)
      // No bank exists
      return null;

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetCoinBalance: ${err}`);
    throw err;
  }
}

export default GetCoinBalance;
