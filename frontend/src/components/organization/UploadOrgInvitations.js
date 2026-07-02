import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function UploadOrgInvitations(payload, _callback) {
  console.log(':: UploadOrgInvitations');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;
  const user = payload.user;

  const uploadPayload = {
    invitation: {
      action: payload.action,
      organization_uuid: payload.organization_uuid,
      creator_user_uuid: user.user_uuid,
      invitation_file_has_header: payload.invitation_file_has_header,
      invitation_file_data: payload.invitation_file_data,
    },
  };

  console.log(`:: UploadOrgInvitations ${JSON.stringify(uploadPayload)}`);

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(uploadPayload),
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
        console.error(`>> UploadOrgInvitations fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UploadOrgInvitations: ${error}`);
    _callback(null);
  }
}

export default UploadOrgInvitations;
