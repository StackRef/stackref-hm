import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function InvalidateOrgInvitation(payload, _callback) {
  console.log(':: InvalidateOrgInvitation');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;
  const user = payload.user;

  const createPayload = {
    invitation: {
      action: payload.action,
      organization_uuid: payload.organization_uuid,
      organization_invitation_uuid: payload.organization_invitation_uuid,
    },
  };

  console.log(`:: InvalidateOrgInvitation ${JSON.stringify(createPayload)}`);

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
        console.error(`>> InvalidateOrgInvitation fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> InvalidateOrgInvitation: ${error}`);
    _callback(null);
  }
}

export default InvalidateOrgInvitation;
