import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function EventEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/eventUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    event: {
      organization_uuid: user.organization_uuid,
      event_uuid: payload.event_uuid,
      ts_event_start: payload.ts_event_start,
      ts_event_end: payload.ts_event_end,
      event_judging_minutes: payload.event_judging_minutes,
      event_status: payload.event_status,
      cloud_accounts_enabled: payload.cloud_accounts_enabled,
      event_type_id: payload.event_type_id,
      event_team_form_mode_id: payload.event_team_form_mode_id,
      event_details: {
        event_name: payload.event_name,
        event_summary: payload.event_summary,
        event_description: payload.event_description,
        event_max_team_size: payload.event_max_team_size,
      },
    },
  };

  console.log(':: EventEdit: ' + JSON.stringify(updatePayload));

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
    const response = await fetch(srAPIUrl, requestOptions);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw data;
    }
    _callback(null, data);
  } catch (error) {
    console.error(`>> EventEdit: ${JSON.stringify(error)}`);
    _callback(error);
  }
}

export default EventEdit;
