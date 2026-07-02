import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function UserEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/userUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    user: {
      ...payload.user_payload,
      settings: {
        ...payload.settings,
      },
      tags: {
        ...payload.tags,
      },
    },
  };

  console.log(':: UserEdit: ' + JSON.stringify(updatePayload));

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
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error('>> UserEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UserEdit: ${error}`);
    _callback(null);
  }
}

export default UserEdit;
