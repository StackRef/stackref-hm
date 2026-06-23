Because we need to apply this to an arbitrary number of organization accounts we've created -- which could be many -- making
terraform changes to each needs to be performed with templating and use of a Makefile.

Requirements:
* `make`
* `tfenv`
* `jq`

To destroy a single account, knowing the account number: `make destroy-single account=ACCOUNT_NUMBER`

To apply to all accounts: `make apply-all`

To plan a single account: `make plan-single account=ACCOUNT_NUMBER`

To apply to single account: `make apply-single account=ACCOUNT_NUMBER`

To destroy a single account: `make destroy-single account=ACCOUNT_NUMBER`

To destroy the entire thing for all accounts and start over: `make destroy-all`

TODO:
* Allow targeted apply/destroy on single account
