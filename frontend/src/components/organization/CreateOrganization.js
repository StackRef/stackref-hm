import { stackrefConfig } from '../../config';

// TODO: Create class or object to contain organization payload

export async function CreateOrganization(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    user_uuid: user.user_uuid,
    organization: {
      organization_name: payload.organization_name,
      organization_domain: payload.organization_domain,
      primary_contact_email: payload.primary_contact_email,
      street_address_1: payload.street_address_1,
      street_address_2: payload.street_address_2,
      city: payload.city,
      state_region: payload.state_region,
      postal_code: payload.postal_code,
      phone: payload.phone,
    },
  };

  console.log(':: CreateOrganization: ' + JSON.stringify(createPayload));

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
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    _callback(data);
  } catch (error) {
    console.error(`>> CreateOrganization: ${error}`);
    _callback(JSON.parse(error));
  }
}

export default CreateOrganization;
