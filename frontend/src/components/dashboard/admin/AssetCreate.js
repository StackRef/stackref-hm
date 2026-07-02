import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function AssetCreate(payload, _callback) {
  let srAPIUrl = `${stackrefConfig.apiUrl}/assetCreate?asset_type=${payload.asset_type}&asset_entity_uuid=${payload.asset_entity_uuid}`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    entity_name: payload.entity_name,
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
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    _callback(data);
  } catch (error) {
    console.error(`>> AssetCreate: ${error}`);
    _callback(error);
  }
}

export default AssetCreate;
