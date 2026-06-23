import { stackrefConfig } from '../../config';

export async function UpdateTeamMemberRoles(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamMemberUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    team_member: {
      team_uuid: payload.team_uuid,
      team_member_uuid: payload.team_member_uuid,
      team_member_roles: payload.team_member_roles,
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
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> UpdateTeamMemberRoles fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UpdateTeamMemberRoles: ${error}`);
    _callback(null);
  }
}

export default UpdateTeamMemberRoles;
