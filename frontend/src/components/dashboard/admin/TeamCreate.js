import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function TeamCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    team: {
      event_uuid: payload.event_uuid,
      team_form_mode: payload.team_form_mode,
      team_details: {
        team_name: payload.team_name,
      },
    },
  };

  console.log(':: TeamCreate: ' + JSON.stringify(createPayload));

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
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        console.log(':: TeamCreate JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .catch((error) => {
        console.error('>> TeamCreate fetch: ', error);
        throw error;
      });
  } catch (error) {
    console.log(`>> TeamCreate: ${error}`);
    _callback(null);
  }
}

export default TeamCreate;
