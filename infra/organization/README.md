To create a CSV of the created accounts, to be used to populate the database:

`terraform output -json account_details | jq -r '(.[0] | keys_unsorted) as $keys | $keys, map([.[ $keys[] ]])[] | @csv' > team_accounts.csv`

To import this file into the DB using DBeaver, see: https://dbeaver.com/docs/wiki/data-transfer/
