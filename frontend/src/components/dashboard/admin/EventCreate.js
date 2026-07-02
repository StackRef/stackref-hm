import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function EventCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/eventCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    event: {
      organization_uuid: user.organization_uuid,
      ts_event_start: payload.ts_event_start,
      ts_event_end: payload.ts_event_end,
      event_judging_minutes: payload.event_judging_minutes,
      cloud_accounts_enabled: payload.cloud_accounts_enabled,
      add_all_users: payload.add_all_users,
      event_type_id: payload.event_type_id,
      event_team_form_mode_id: payload.event_team_form_mode_id,
      generate_image: payload.generate_image,
      event_details: {
        event_name: payload.event_name,
        event_summary: payload.event_summary,
        event_description: payload.event_description,
        event_max_team_size: payload.event_max_team_size,
      },
      entity_asset: payload.entity_asset,
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
    console.error(`>> EventCreate: ${error}`);
    _callback(error);
  }
}

export default EventCreate;
