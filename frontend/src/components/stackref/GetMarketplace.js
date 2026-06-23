import { stackrefConfig } from 'src/config';

export async function GetMarketplace(user) {
  console.log(':: GetMarketplace');

  const srAPIUrl = `${stackrefConfig.apiUrl}/marketplaceRead`;

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
      const error = new Error(`>> GetMarketplace: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetMarketplace: ${err}`);
    throw err;
  }
}

export default GetMarketplace;
