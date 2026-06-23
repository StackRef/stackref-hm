#!/usr/bin/env bash

while IFS="," read -r cloud_account_cloud_id cloud_account_name cloud_account_owner_type cloud_account_owner_uuid cloud_account_provider_id cloud_account_uuid
do
  echo ":: cloud_account_cloud_id: ${cloud_account_cloud_id}"
  echo ":: cloud_account_name: ${cloud_account_name}"
  echo ""

  account=${cloud_account_cloud_id} account_name=${cloud_account_name} make apply-single
done < <(tail -n +2 ./team_accounts.csv)
