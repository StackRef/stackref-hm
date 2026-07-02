The `get_aws_sso_groups.py` script is used to retrieve the configured AWS SSO Groups
configured via the ansible scripts. This will output CSV-formatted data
that can then be imported to the `cloud_account_group` table.

The below steps assume the required variables are set with the provided
names in 1Password.

```
export AWS_SCIM_API_URL=$(op item get aws_scim_api_url --fields notesPlain)
export AWS_SCIM_API_TOKEN=$(op item get aws_scim_api_token --fields notesPlain)

./get_aws_sso_groups.py > cloud_account_groups.csv
```

You will then need to get the `account_uuid` from the `cloud_account`
table and add to that table before importing.
