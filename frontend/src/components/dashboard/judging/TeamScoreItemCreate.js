import { stackrefConfig } from 'src/config';

// TODO: Create class or object to contain Event payload

export async function TeamScoreItemCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamScoreItemCreate`;
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

  console.log(':: TeamScoreItemCreate: ' + JSON.stringify(updatePayload));

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
        console.log(
          ':: TeamScoreItemCreate JSON data: ' + JSON.stringify(data),
        );
        _callback(data);
      })
      .catch((error) => {
        console.error('>> TeamScoreItemCreate fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> TeamScoreItemCreate: ${error}`);
    _callback(null);
  }
}

export default TeamScoreItemCreate;
