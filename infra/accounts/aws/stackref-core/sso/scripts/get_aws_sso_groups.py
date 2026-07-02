#!/usr/bin/env python3

import json
import os
import requests
import uuid

aws_scim_api_url = os.environ.get('AWS_SCIM_API_URL')
aws_scim_api_token = os.environ.get('AWS_SCIM_API_TOKEN')

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Bearer {aws_scim_api_token}"
}

response = requests.get(f"{aws_scim_api_url}/Groups", headers=headers)
json_response = json.loads(response.content)

print('cloud_account_group_uuid,cloud_account_group_id,cloud_account_group_name')
for resource in json_response['Resources']:
  if '-stackref-team-' in resource['displayName']:
    print(f"{uuid.uuid4()},{resource['id']},{resource['displayName']}")
