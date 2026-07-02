import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain organization payload

export async function UpdateOrganization(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/organizationUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    organization: {
      organization_uuid: payload.organization_uuid,
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

  console.log(':: UpdateOrganization: ' + JSON.stringify(updatePayload));

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
        console.error(`>> UpdateOrganization fetch: ${error}`);
        throw new Error(error);
      });
  } catch (error) {
    console.error(`>> UpdateOrganization: ${error}`);
    _callback(null);
  }
}

export default UpdateOrganization;
