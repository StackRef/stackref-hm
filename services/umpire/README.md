# services/umpire

**Team-account monitoring (the "referee").** `umpire` is deployed *into team AWS
accounts* and watches what each team does, streaming meaningful activity back to the
control plane so organizers can observe events live and enforce rules.

## How it works

A Lambda processes two event sources in the team account:

- **AWS Config** (`process_aws_config.py`) — resource configuration changes.
- **CloudTrail** (`process_cloudtrail.py`) — API activity.

Relevant events are forwarded to **tator** (via `tatorWebsocketEventBridge`), which
pushes them to the UI. CloudWatch metric/log filters (`cloudwatch.tf`) flag specific
create/modify/delete activity of interest.

## Deploy

`umpire` is applied per team account. The Terraform here provisions the Lambda
(`lambda.tf`), AWS Config (`config.tf`), CloudWatch wiring, SNS, S3, and IAM.

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

The [`team_accounts/`](team_accounts/) directory contains the per-team-account
application of this module. See [`docs/architecture.md`](../../docs/architecture.md)
for how umpire fits into the multi-account model.

## Notes

- Because it runs in untrusted-ish team accounts, umpire is intentionally minimal and
  forwards outward to the core account rather than holding state locally.
