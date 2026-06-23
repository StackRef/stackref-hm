import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function UpdateUserRoles(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/userUpdate`;
  const user = payload.user;

  //console.log(':: UpdateUserRoles: ' + JSON.stringify(payload));

  const updatePayload = {
    action: payload.action,
    user: {
      user_uuid: payload.user_uuid,
      organization_uuid: payload.organization_uuid,
      user_roles: payload.user_roles,
    },
  };

  console.log(':: UpdateUserRoles: ' + JSON.stringify(updatePayload));

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
        console.error('>> UpdateUserRoles fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UpdateUserRoles: ${error}`);
    _callback(null);
  }
}

export default UpdateUserRoles;
