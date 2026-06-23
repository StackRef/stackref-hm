#!/usr/bin/env bash

STATE_FILES=()

for MAINFILE in $(find ~/src/stackref/terraform -type f -name "main.tf"); do
  BUCKET=$(hcl2json < ${MAINFILE} | jq -r '.terraform[].backend.s3[].bucket')
  KEY=$(hcl2json < ${MAINFILE} | jq -r '.terraform[].backend.s3[].key')
  if [[ ${BUCKET} ]]; then
    STATE_FILE="tfstate+s3://${BUCKET}/${KEY}"
    echo ${STATE_FILE}
    STATE_FILES+=(${STATE_FILE})
  fi
  unset BUCKET
  unset KEY
done

for MAINFILE in $(find ~/src/stackref/api-lambda -type f -name "main.tf"); do
  BUCKET=$(hcl2json < ${MAINFILE} | jq -r '.terraform[].backend.s3[].bucket')
  KEY=$(hcl2json < ${MAINFILE} | jq -r '.terraform[].backend.s3[].key')
  if [[ ${BUCKET} ]]; then
    STATE_FILE="tfstate+s3://${BUCKET}/${KEY}"
    echo ${STATE_FILE}
    STATE_FILES+=(${STATE_FILE})
  fi
  unset BUCKET
  unset KEY
done

printf -v STATE_FILE_LIST '%s,' "${STATE_FILES[@]}"

snyk iac describe --from="${STATE_FILE_LIST%,}" --only-unmanaged
