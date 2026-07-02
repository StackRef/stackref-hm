 Use `terraform.secret.tfvars` with the following set:

```
aws_access_key_id
aws_default_region
aws_secret_access_key
gitlab_token
slack_webhook_url
snyk_token
```

When creating a new repo, the `develop` branch and its branch protection is already in place.
Because of this, attempting to change the branch protection will attempt to create a NEW
branch protection and not replace the one that already exists. To get around this, you must
first import that branch to the state, *then* apply the branch protection change.

`terraform import -var-file ./terraform.secret.tfvars 'gitlab_branch_protection.develop["REPOSITORY_NAME"]' PROJECT_ID:develop`

Example:
`terraform import -var-file ./terraform.secret.tfvars 'gitlab_branch_protection.develop["cleanup_crew"]' 39603792:develop`

Once the import is done, do another `terraform apply` to make the branch protection changes.
