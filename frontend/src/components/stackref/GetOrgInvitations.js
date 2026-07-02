import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain playbook payload

export async function GetOrgInvitations(user) {
  console.log(':: GetOrgInvitations');

  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationInvitation`;

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
  };

  try {
    const response = await fetch(
      `${srAPIUrl}?organization_uuid=${user.organization_uuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetOrgInvitations: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetOrgInvitations: ${err}`);
    throw err;
  }
}

export default GetOrgInvitations;
