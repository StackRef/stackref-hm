import { stackrefConfig } from '../../config';

// TODO: Create class or object to contain organization payload

export async function ResendOrgInvitation(payload, _callback) {
  console.log(':: ResendOrgInvitation');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;
  const user = payload.user;

  const createPayload = {
    invitation: {
      action: payload.action,
      organization_invitation_uuid: payload.organization_invitation_uuid,
      organization_uuid: payload.organization_uuid,
      invitation_email: payload.invitation_email,
      invitation_code: payload.invitation_code,
    },
  };

  console.log(`:: ResendOrgInvitation ${JSON.stringify(createPayload)}`);

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
        console.log(
          `:: ResendOrgInvitation JSON data: ${JSON.stringify(data)}`,
        );
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> ResendOrgInvitation fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> ResendOrgInvitation: ${error}`);
    _callback(error);
  }
}

export default ResendOrgInvitation;
