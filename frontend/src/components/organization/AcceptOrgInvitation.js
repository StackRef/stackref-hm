import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function AcceptOrgInvitation(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;
  const user = payload.user;

  const invitationPayload = {
    invitation: {
      action: 'claim',
      claiming_user_uuid: user.user_uuid,
      invitation_code: payload.invitation_code,
    },
  };

  console.log(':: AcceptOrgInvitation: ' + JSON.stringify(invitationPayload));

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(invitationPayload),
  };

  try {
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    _callback(data);
  } catch (error) {
    console.error(`>> AcceptOrgInvitation: ${error}`);
    _callback(JSON.parse(error));
  }
}

export default AcceptOrgInvitation;
