import { stackrefConfig } from 'src/config';

export async function CloudAccountUserCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/cloudAccountUserCreate`;
  const user = payload.user;
  const entityUuid = payload.entity_uuid;

  const createPayload = {
    cloud_account_user: {
      user_uuid: user.user_uuid,
      team_uuid: entityUuid,
      access_level: 1,
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
    body: JSON.stringify(createPayload),
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
        console.error(`>> CloudAccountUserCreate fetch: ${error}`);
        throw error;
      });
  } catch (error) {
    console.error(`>> CloudAccountUserCreate: ${error}`);
    _callback(null);
  }
}

export default CloudAccountUserCreate;
