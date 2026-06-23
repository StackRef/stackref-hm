# services/shot-clock

**Scheduled jobs.** `shot-clock` runs time-based, recurring work via Amazon
EventBridge schedules.

## Jobs

| Lambda | Role |
|---|---|
| `amazonMktMeter` | Reports **Amazon Marketplace** SaaS metering/usage on a schedule |
| `processInvitationList` | Processes pending participant invitation lists |

## Deploy

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

Terraform provisions the Lambdas (`lambda-amazonMktMeter.tf`,
`lambda-processInvitationList.tf`), the EventBridge schedule (`eventbridge.tf`), a
shared layer, SQS, IAM, ElastiCache, and RDS data sources. Each Lambda is a `src/`
package (`main.main`) built into `payload/`, following the same pattern as
[`api/`](../../api/README.md).

## Notes

- `amazonMktMeter` is only relevant if you distribute via the **AWS Marketplace**.
  Leave it disabled otherwise.
