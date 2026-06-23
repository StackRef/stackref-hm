import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function CreateOrgInvitation(payload, _callback) {
  console.log(':: CreateOrgInvitation');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;
  const user = payload.user;

  const createPayload = {
    invitation: {
      action: payload.action,
      organization_uuid: payload.organization_uuid,
      creator_user_uuid: user.user_uuid,
      invitation_email: payload.invitation_email,
    },
  };

  console.log(`:: CreateOrgInvitation ${JSON.stringify(createPayload)}`);

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
        console.error(`>> CreateOrgInvitation fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> CreateOrgInvitation: ${error}`);
    _callback(null);
  }
}

export default CreateOrgInvitation;
