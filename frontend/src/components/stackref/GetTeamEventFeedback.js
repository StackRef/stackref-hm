import { stackrefConfig } from 'src/config';

export async function GetTeamEventFeedback(user, options = {}) {
  console.log(':: GetTeamEventFeedback');

  const participantUuid = options.participantUuid
    ? options.participantUuid
    : '';
  const teamUuid = options.teamUuid ? options.teamUuid : '';
  const eventUuid = options.eventUuid ? options.eventUuid : '';

  const srAPIUrl = `${stackrefConfig.apiUrl}/teamEventFeedbackRead`;

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
      `${srAPIUrl}?event_uuid=${eventUuid}&team_uuid=${teamUuid}&participant_uuid=${participantUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetTeamEventFeedback: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetTeamEventFeedback: ${err}`);
    throw err;
  }
}

export default GetTeamEventFeedback;
