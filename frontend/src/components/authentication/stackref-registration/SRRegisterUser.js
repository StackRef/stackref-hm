import { stackrefConfig } from 'src/config';

export async function SRRegisterUser(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/userRegistration`;
  const user = payload.user;

  const registrationPayload = {
    action: payload.action,
    user: {
      user_uuid: user.user_uuid,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      job_title: payload.job_title,
    },
  };

  console.log(':: SRRegisterUser: ' + JSON.stringify(registrationPayload));

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(registrationPayload),
  };

  try {
    await fetch(srAPIUrl, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(':: SRRegisterUser JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .then(() => console.log(':: User registration complete'))
      .catch((error) => {
        throw new Error(error);
      });
  } catch (e) {
    console.error(e);
    _callback(e);
  }
}

export default SRRegisterUser;
