import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function KanbanItemEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/kanbanUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    kanban_item: {
      team_uuid: payload.team_uuid,
      kanban_item_uuid: payload.kanban_item_uuid,
      kanban_item_status_id: payload.kanban_item_status_id,
      kanban_item_priority: payload.kanban_item_priority,
      kanban_item_issuer_uuid: payload.kanban_item_issuer_uuid,
      kanban_item_owner_uuid: payload.kanban_item_owner_uuid,
      kanban_item_details: payload.kanban_item_details,
    },
  };

  console.log(':: KanbanItemEdit: ' + JSON.stringify(updatePayload));

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
        console.log(':: KanbanItemEdit JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .catch((error) => {
        console.error('>> KanbanItemEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> KanbanItemEdit: ${error}`);
    _callback(null);
  }
}

export default KanbanItemEdit;
