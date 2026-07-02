# services/kickoff

**Event orchestration.** `kickoff` does the heavy, asynchronous work of starting and
progressing a hackathon event.

## Responsibilities

- **Form teams** from registered participants (`form_event_teams`).
- Create initial **kanban** items and **team-analysis** records.
- Trigger **code scans** of team repositories (`kickoffCodeScan`, against CodeCommit).
- **Record results** (`kickoffRecordResults`) and aggregate scoring.
- **Complete** an event (`complete_event`).

It is event-driven, fed by SQS (`kickoffSQS`).

## Lambdas

| Lambda | Role |
|---|---|
| `kickoff` | Main orchestration entrypoint |
| `kickoffSQS` | SQS-driven worker |
| `kickoffCodeScan` | Scans team code (CodeCommit) |
| `kickoffRecordResults` | Persists scan/scoring results |

The `kickoff` flow also calls the **AI scorer** (see [`ai/`](../../ai/README.md)) and
emits events to **tator** for live UI updates.

## Deploy

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

Terraform provisions the Lambdas (`lambda-kickoff*.tf`), SQS, IAM, ElastiCache, and
RDS data sources. Each Lambda is a `src/` package (`main.main`) built into `payload/`,
following the same pattern as [`api/`](../../api/README.md).
