import { stackrefConfig } from 'src/config';

export async function CloudAccountUpdate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/cloudAccountUpdate`;
  const user = payload.user;
  const entityUuid = payload.entity_uuid;

  const updatePayload = {
    action: payload.action,
    cloud_account: {
      entity_uuid: entityUuid,
    },
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(updatePayload),
  };

  try {
    await fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status);
        } else {
          return response.json();
        }
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> CloudAccountUpdate fetch: ${error}`);
        throw error;
      });
  } catch (error) {
    console.error(`>> CloudAccountUpdate: ${error}`);
    _callback(null);
  }
}

export default CloudAccountUpdate;
