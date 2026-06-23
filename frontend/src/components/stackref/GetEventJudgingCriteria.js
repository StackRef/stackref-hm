import { stackrefConfig } from 'src/config';

export async function GetEventJudgingCriteria(user, ...other) {
  console.log(':: GetEventJudgingCriteria');

  const eventUuid = other || '';

  const srAPIUrl = `${stackrefConfig.apiUrl}/judgingCriterionRead`;

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
      `${srAPIUrl}?organization_uuid=${user.organization_uuid}&event_uuid=${eventUuid}`,
      requestOptions,
    );

    if (!response.ok) {
      const error = new Error(`>> GetEventJudgingCriteria: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`>> GetEventJudgingCriteria: ${err}`);
    throw err;
  }
}

export default GetEventJudgingCriteria;
