import { stackrefConfig } from 'src/config';
import { OverviewLatestPlaybooks } from 'src/components/dashboard/overview';

// TODO: Create class or object to contain playbook payload

export function PublishPlaybook(playbook, user, _callback) {
  const organizationUUID = playbook.organization_uuid;
  const eventUUID = playbook.event_uuid;
  const srAPIUrl = `${stackrefConfig.apiUrl}/playbooks`;

  playbook = {
    playbook: [playbook],
  };

  console.log(':: PublishPlaybook: ' + JSON.stringify(playbook));

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
      'x-sr-organization-uuid': organizationUUID,
      'x-sr-event-uuid': eventUUID,
    },
    mode: 'cors',
    body: JSON.stringify(playbook),
  };

  try {
    fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok)
          throw new Error(response.status, { cause: response.status });
        else return response.json();
      })
      .then((data) => {
        console.log(':: PublishPlaybook JSON data: ' + JSON.stringify(data));
        _callback(data);
      })
      .then(() => console.log(':: POSTed playbook'))
      .catch((err) => {
        console.error('>> PublishPlaybook fetch: ', err);
      });
  } catch (e) {
    console.log(e);
    _callback(e);
  }
}

export default PublishPlaybook;
