Only do this the first time running this terraform:

1. `pip3 install google_auth_httplib2`
2. Run `.\gw-service-account.py`. It will fail on the `cloudshell` step but should still download the `.json` key locally -- **DO NOT COMMIT THE JSON FILE!**
3. Run `export GOOGLEWORKSPACE_CREDENTIALS=$(pwd)/tfws-service-account-key-DATE.json`

Next:

1. Configure the correct values in `terraform.tfvars` for your user.
2. `terraform init -upgrade`
3. `terraform apply`

NOTES:

If importing a user role assignment, you'll need to retrieve the `roleAssignmentId` from somewhere like https://developers.google.com/admin-sdk/directory/reference/rest/v1/roleAssignments/list
