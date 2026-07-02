import { stackrefConfig } from 'src/config';

export async function UtilizeAmznMktEntitlement(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/amznMktEntitlement`;
  const user = payload.user;

  const entitlementPayload = {
    action: 'utilize',
    entitlement: 'undefined',
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(entitlementPayload),
  };

  try {
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    // TODO: Returning only the first entitlement response for now
    _callback(data[0]);
  } catch (error) {
    console.error(`>> UtilizeAmznMktEntitlement: ${error}`);
    _callback(JSON.parse(error));
  }
}

export default UtilizeAmznMktEntitlement;
