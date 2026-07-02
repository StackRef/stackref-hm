import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function TeamEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    team: {
      team_uuid: payload.team_uuid,
      team_details: {
        team_name: payload.team_name,
      },
    },
  };

  console.log(':: TeamEdit: ' + JSON.stringify(updatePayload));

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
        console.log(':: TeamEdit JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .catch((error) => {
        console.error('>> TeamEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> TeamEdit: ${error}`);
    _callback(null);
  }
}

export default TeamEdit;
