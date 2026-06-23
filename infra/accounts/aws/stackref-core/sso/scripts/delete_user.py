#!/usr/bin/env python3

import json
import os
import requests

aws_scim_api_url = os.environ.get('AWS_SCIM_API_URL')
aws_scim_api_token = os.environ.get('AWS_SCIM_API_TOKEN')

# Use the User ID in AWS SSO
# file deepcode ignore NoHardcodedCredentials: Not credentials
user_id = '90674d7856-80eb217b-eaec-4c11-9179-7371032665dd'

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Bearer {aws_scim_api_token}"
}

response = requests.delete(f"{aws_scim_api_url}/Users/{user_id}", headers=headers)

print(response.text)
