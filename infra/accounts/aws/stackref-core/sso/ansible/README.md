## 2023-01-12: This is here for historical purposes only. This is all handled in Terraform now (KM)

Most of this is taken from: https://github.com/runtastic/ansible-iam

To manage users in SSO:

1. On OS X, make sure you set: `export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES` to allow the AWS collection to work.

2. Set your `AWS_PROFILE` env var to the `stackref-core` account.

3. To provision users:

```
ansible-playbook -i localhost, -c local ./aws_manage_users.yml -e @./aws_sso_users.json
```

4. To provision groups:

```
ansible-playbook -i localhost, -c local ./aws_manage_groups.yml -e @./aws_sso_users.json
```

**NOTE**: You must run the above groups tasks before running the Terraform for the first time, otherwise the groups will not be present to apply the Permission Sets to.

---

Format for `aws_sso_users.json`:

```
{
  "group_details": [
    {
      "aws": [
        {
          "name": "Administrators"
        },
        {
          "name": "ReadOnly"
        },
        {
          "name": "TeamWrite-stackref-team-001"
        }
      ]
    }
  ],
  "user_details": [
    {
      "general": {
        "uid": "jordanm@example.net",
        "firstname": "Jordan",
        "lastname": "Avery",
        "email": "jordanm@example.net"
      },
      "aws": {
        "state": "present", // NOTE: Mark 'absent' to remove the user
        "groups": [
          "Administrators"
        ]
      }
    }
  ]
}
```

Format for `secrets.json`:

```
{
  "aws_api_url": "UNIQUE_SCIM_ENDPOINT_URL_FROM_AWS",
  "aws_api_token": "SECRET_TOKEN_FROM_AWS"
}
`
