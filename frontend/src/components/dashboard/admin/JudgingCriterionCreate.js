import { stackrefConfig } from 'src/config';

export async function JudgingCriterionCreate(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/judgingCriterionCreate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    criterion: {
      organization_uuid: user.organization_uuid,
      event_uuid: payload.event_uuid,
      criterion_weight: payload.criterion_weight,
      category_id: payload.category_id,
      criterion_details: {
        criterion_name: payload.criterion_name,
        criterion_summary: payload.criterion_summary,
        criterion_description: payload.criterion_description,
      },
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
    await fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> JudgingCriterionCreate fetch: ${error}`);
        throw error;
      });
  } catch (error) {
    console.error(`>> JudgingCriterionCreate: ${error}`);
    _callback(null);
  }
}

export default JudgingCriterionCreate;
