# Architecture

StackRef HM is a collection of independently deployable components that together run
cloud hackathons on real AWS accounts. This document explains the pieces, how they
communicate, the multi-account model, and the lifecycle of an event.

## Mental model

A hackathon in StackRef is an **Event** that belongs to an **Organization**. People
join an event as **Participants**, who are grouped into **Teams**. Each team is given
its own **real, isolated AWS account** (a member account in an AWS Organization) to
build in. The platform watches those accounts, scores the work, and supports judges
who rate teams against **Judging Criteria**. Supporting concepts include a kanban
board per team, a "**coin bank**" reward economy, a **marketplace** of resources, and
**playbooks/resources/services** (the `coach` domain) that guide participants.

## Components and responsibilities

### `frontend/` — the web application
A React 18 single-page app (Create React App via `react-app-rewired`, MUI, Redux
Toolkit). It authenticates users against **Auth0**, calls the REST API with a bearer
JWT, and holds an open **WebSocket** to receive live updates. Built as static assets
and served from S3 + CloudFront.

### `api/` — the REST API
~55 **single-purpose Python 3.11 Lambda functions**, each in its own directory with a
`main.main` handler, deployed behind **API Gateway** (REST). Functions are grouped by
domain noun and verb, e.g. `eventCreate`, `teamRead`, `judgingCriterionUpdate`,
`kanbanUpdate`, `coinBankRead`. Cross-cutting code (DB access, caching, Auth0 JWT
verification) is shared through a **Lambda layer** and a vendored `stackref` package
inside each function. The API:

- verifies the Auth0 JWT on each request (`stackref/auth0/auth0_jwt.py`),
- reads/writes **PostgreSQL** via `psycopg`,
- caches through **ElastiCache (memcached)** via `pymemcache`,
- pulls DB credentials from **AWS Secrets Manager** at cold start,
- reports errors to **Sentry**.

### `database/` — the schema
PostgreSQL DDL as **numbered migration files** applied in order (`0001…`, `0010…`,
… `1015…`). Two schemas:
- **`sr`** — the product domain: organizations, users/roles, events, participants,
  teams, cloud accounts, judging, kanban, marketplace, coin transactions, assets,
  Amazon Marketplace entitlement/metering, Stripe payments.
- **`coach`** — guidance content: resources, playbooks, services.

A `zload-test-data.sql` seed file populates a demo data set.

### `services/tator/` — realtime ("spectator")
The live-update backbone. A set of Lambdas behind an **API Gateway WebSocket API**:
`tatorWebsocketConnect/Disconnect/Default` manage client connections (stored in
**DynamoDB**); `tatorWebsocketEventBridge`, `tatorSQS`, and `tatorDDBStream` receive
events from the rest of the system and **fan them out** to the right connected
clients. This is how the UI reflects team activity, scores, and account changes
without polling.

### `services/kickoff/` — event orchestration
When an event starts (or transitions), **kickoff** does the heavy lifting:
`form_event_teams`, create kanban items, create team-analysis records, trigger
**code scans** of team repositories (`kickoffCodeScan` against CodeCommit),
`kickoffRecordResults`, and `complete_event`. It is SQS-driven (`kickoffSQS`).

### `services/shot-clock/` — scheduled jobs
EventBridge-scheduled Lambdas for time-based work: **Amazon Marketplace metering**
(`amazonMktMeter`, reporting SaaS usage) and **invitation list processing**
(`processInvitationList`).

### `services/umpire/` — team-account monitoring (the "referee")
Deployed into team accounts, umpire processes **AWS Config** and **CloudTrail**
events (`process_aws_config.py`, `process_cloudtrail.py`) and forwards meaningful
activity to tator (via `tatorWebsocketEventBridge`) so organizers can watch what
teams are doing and enforce rules.

### `services/cleanup-crew/` — account reset
A Docker image that runs **`aws-nuke`** with a guarded configuration
(`nuke-config.yml`) to wipe team accounts clean between events, while protecting the
resources StackRef itself needs. Also handles CodeCommit cleanup.

### `ai/` — code scoring (`cossell`)
A Python service (LangChain + Anthropic/OpenAI + sentence-transformers/Chroma) that
loads a team's repository, summarizes it, and produces scores for **security**,
**code smells**, and **complexity**, plus commentary. Containerized and invoked as
part of the kickoff/scoring flow.

### `auth0/` — identity
Auth0 tenant configuration: a custom login page, **post-login** and
**post-user-registration** Actions (which sync users into StackRef and apply grants),
and Terraform to manage clients, connections, and actions.

### `infra/` — foundational infrastructure
Terraform for everything underneath the application:
- **`accounts/aws/`** — the AWS Organizations layout: a `stackref-core` account
  (Route53, SES, SSO/Identity Center, CloudTrail, ECR, team management, Auth0
  authorizer, bastion, etc.), a `stackref-analysis-codescans` account, a
  `stackref-marketplace` account, and the **team accounts** themselves.
- **`databases/`**, **`vpcs/`** — Aurora/RDS and networking.
- **`organization/`** — the AWS Organizations root + OUs.
- **`gitlab/`**, **`gcp/`**, **`google_workspace/`**, **`stripe/`** — supporting SaaS
  integrations.

## How a request flows

1. The user logs in via **Auth0**; the SPA receives a JWT.
2. The SPA calls `api/` through **API Gateway**, sending the JWT. Each Lambda verifies
   it, then reads/writes **PostgreSQL** (with **ElastiCache** in front).
3. State changes that others should see are emitted to **tator**, which pushes them
   over the **WebSocket** to the relevant clients.
4. Long-running or scheduled work (starting an event, scanning code, metering usage,
   resetting accounts) happens asynchronously in **kickoff**, **shot-clock**,
   **cleanup-crew**, and the **AI** service.

## The multi-account model

```
AWS Organization (root)
├── stackref-core                # control plane: API, tator, kickoff, RDS, SSO, SES…
├── stackref-analysis-codescans  # isolated account for scanning team code
├── stackref-marketplace         # Amazon Marketplace SaaS integration
└── team-accounts/               # one real AWS account per team
    ├── team-001  ← umpire (monitoring) + cleanup-crew (reset)
    ├── team-002
    └── …
```

Team accounts are provisioned through AWS Organizations/Account Factory, monitored by
**umpire**, and reset by **cleanup-crew** between events. SSO/Identity Center grants
team members scoped access (`TeamWrite-…` permission sets) to their own account only.

## Event lifecycle

1. **Create** — an organizer creates an Organization and an Event, defines judging
   criteria, and invites participants (`api`, `shot-clock` invitation processing).
2. **Form teams** — participants register; **kickoff** forms teams and provisions a
   team AWS account for each.
3. **Run** — teams build in their accounts. **umpire** streams their activity to
   **tator**; the UI shows it live. Teams use kanban boards and the marketplace; the
   coin bank tracks rewards.
4. **Score & judge** — **kickoff** triggers code scans and the **AI** scorer; judges
   rate teams against criteria; scores aggregate into `team-score-item` records.
5. **Complete** — the event ends; results are recorded.
6. **Reset** — **cleanup-crew** nukes the team accounts so they can be reused.

## Cross-cutting concerns

- **Auth** — Auth0 issues JWTs; the API and tator verify them; an Auth0 authorizer
  Lambda backs API Gateway.
- **Secrets** — DB credentials and integration keys live in **Secrets Manager** /
  **SSM Parameter Store**, never in code.
- **Caching** — ElastiCache (memcached) fronts hot reads.
- **Observability** — Sentry for errors across frontend and Lambdas.
- **Billing** — Stripe and/or Amazon Marketplace metering, depending on channel.
