import { stackrefConfig } from 'src/config';

export async function ActivateAmznMktEntitlement(user, token, ...other) {
  console.log(':: ActivateAmznMktEntitlement');

  const srAPIUrl = `${stackrefConfig.apiUrl}/amznMktEntitlement`;

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
      `${srAPIUrl}?x-amzn-marketplace-token=${encodeURIComponent(token)}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(
        `>> ActivateAmznMktEntitlement: ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error(`>> ActivateAmznMktEntitlement: ${err}`);
    throw err;
  }
}

export default ActivateAmznMktEntitlement;
