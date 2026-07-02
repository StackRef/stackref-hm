import { stackrefConfig } from 'src/config';

export async function TeamMemberCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamMemberCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    team_member: {
      participant_uuid: payload.participant_uuid,
      team_uuid: payload.team_uuid,
      team_member_role_id: payload.team_member_role_id,
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
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> TeamMemberCreate fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> TeamMemberCreate: ${error}`);
    _callback(null);
  }
}

export default TeamMemberCreate;
