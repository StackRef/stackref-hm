import { stackrefConfig } from 'src/config';

export async function TeamEventFeedbackEdit(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/teamEventFeedbackUpdate`;
  const user = payload.user;

  const updatePayload = {
    action: payload.action,
    team_event_feedback: {
      participant_uuid: payload.participant_uuid,
      team_uuid: payload.team_uuid,
      event_uuid: payload.event_uuid,
      feedback_text: payload.feedback_text,
    },
  };

  console.log(':: TeamEventFeedbackEdit: ' + JSON.stringify(updatePayload));

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
          ':: TeamEventFeedbackEdit JSON data: ' + JSON.stringify(data),
        );
        _callback(data);
      })
      .catch((error) => {
        console.error('>> TeamEventFeedbackEdit fetch: ', error);
        throw new Error(error);
      });
  } catch (error) {
    console.log(`>> TeamEventFeedbackEdit: ${error}`);
    _callback(null);
  }
}

export default TeamEventFeedbackEdit;
