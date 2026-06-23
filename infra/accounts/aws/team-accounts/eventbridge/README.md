This terraform is for initial setup of Team accounts with Event Bridge
to send events over to the stackref-core Event Bus.

`account=<ACCOUNT #> account_name=stackref-team-<#> make apply-single`

## Applying to all team accounts

You can run the `apply_all.sh` script, though you must make sure the file in the parent
directory has the correct/updated `team_accounts.csv` file to associate the team
accounts and names.

The most up-to-date `team_accounts.csv` should be present in the `organization` directory
at the top level of this repository.
