import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function TeamScoreItemEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamScoreItemUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    team_score_item: {
      team_uuid: payload.team_uuid,
      judge_uuid: payload.judge_uuid,
      judging_criterion_uuid: payload.judging_criterion_uuid,
      team_score_item_value: payload.team_score_item_value,
    },
  };

  console.log(':: TeamScoreItemEdit: ' + JSON.stringify(updatePayload));

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
        console.log(':: TeamScoreItemEdit JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .catch((error) => {
        console.error('>> TeamScoreItemEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> TeamScoreItemEdit: ${error}`);
    _callback(null);
  }
}

export default TeamScoreItemEdit;
