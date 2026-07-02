import { stackrefConfig } from 'src/config';

export async function CloudAccountUserDelete(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/cloudAccountUserDelete`;
  const user = payload.user;
  const teamMemberUuid = payload.team_member_uuid;
  const entityUuid = payload.entity_uuid;

  const deletePayload = {
    cloud_account_user: {
      team_member_uuid: teamMemberUuid,
      team_uuid: entityUuid,
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
    body: JSON.stringify(deletePayload),
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
        console.error(`>> CloudAccountUserDelete fetch: ${error}`);
        throw error;
      });
  } catch (error) {
    console.error(`>> CloudAccountUserDelete: ${error}`);
    _callback(null);
  }
}

export default CloudAccountUserDelete;
