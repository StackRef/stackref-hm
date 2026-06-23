# services/tator

**Realtime fan-out.** `tator` (as in spec­*tator*) is the WebSocket backbone that
pushes live updates to the StackRef HM frontend, so the UI reflects team activity,
scores, and account changes without polling.

## How it works

An **API Gateway WebSocket API** plus a set of Python Lambdas:

| Lambda | Role |
|---|---|
| `tatorWebsocketConnect` | Registers a new client connection (stored in **DynamoDB**) |
| `tatorWebsocketDisconnect` | Removes a connection |
| `tatorWebsocketDefault` | Handles inbound messages from clients |
| `tatorWebsocketEventBridge` | Receives platform events (e.g. from umpire) and routes them |
| `tatorSQS` | Receives events from SQS and fans them out |
| `tatorDDBStream` | Reacts to DynamoDB streams |

Connections live in DynamoDB; incoming events (from EventBridge, SQS, or DDB streams)
are matched to the right connections and delivered over the socket. Auth0 JWTs are
verified on connect (`stackref/auth0/auth0_jwt.py`).

## Deploy

```bash
cp terraform.tfvars.example terraform.tfvars   # account, domain, DB, Auth0, versions
terraform init && terraform plan && terraform apply
```

Terraform here provisions the WebSocket API, the Lambdas (`lambda-tator*.tf`),
DynamoDB, SQS, EventBridge wiring, IAM, and the `wss://` custom domain. Note the
resulting `wss://` endpoint — the `frontend` needs it as `REACT_APP_SR_WS_BASE`.

## Build

Each Lambda is a `src/` package (`main.main`) with its own dependencies, packaged into
`payload/` and deployed by the corresponding `.tf` file — the same pattern as
[`api/`](../../api/README.md).
