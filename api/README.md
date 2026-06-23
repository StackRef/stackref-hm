# api

The StackRef HM **REST API**: a set of ~55 single-purpose AWS Lambda functions behind
**API Gateway**, with the gateway and all functions defined as Terraform in
[`terraform/`](terraform/).

## Design

Each API operation is its own Lambda function in its own directory, named
`<noun><Verb>` — for example `eventCreate`, `eventRead`, `teamRead`,
`judgingCriterionUpdate`, `kanbanUpdate`, `coinBankRead`, `participantCreate`. Every
function follows the same shape:

```
<function>/
├── src/
│   ├── main.py            # handler: main.main
│   ├── requirements.txt   # function dependencies
│   ├── setup.py
│   └── stackref/          # shared helpers (DB, cache, Auth0 JWT, settings)
└── payload/               # build output (gitignored)
```

Cross-cutting behavior lives in the vendored `stackref/` package and a shared
**Lambda layer** ([`terraform/lambda-layer.tf`](terraform/lambda-layer.tf)):

- **Auth** — `stackref/auth0/auth0_jwt.py` verifies the Auth0 JWT on each request.
- **Database** — `psycopg` against PostgreSQL; credentials are fetched from **AWS
  Secrets Manager** at cold start (`stackref/settings.py`).
- **Caching** — `pymemcache` against **ElastiCache (memcached)**, with
  `elasticache-auto-discovery`.
- **Errors** — Sentry.

## Runtime

- **Python 3.11**, handler `main.main`.
- Functions run inside the VPC to reach RDS and ElastiCache.

## Building a function payload

Each function is packaged by installing its dependencies alongside its source and
zipping the result, which the Terraform `archive_file` data source then deploys.
Conceptually:

```bash
cd <function>/src
pip install -r requirements.txt -t .     # vendor deps into the package
# Terraform zips src/ -> payload/ and uploads it (see the function's .tf file)
```

Common dependencies are provided by the shared layer rather than vendored per
function. See each `lambda-<function>.tf` for the exact `source_dir` / `filename`
wiring.

## Deploying

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in account, domain, Auth0, DB, cache
terraform init && terraform plan && terraform apply
```

`terraform/` provisions API Gateway (`apigateway.tf`), every function
(`lambda-*.tf`), the shared layer, IAM, KMS, ElastiCache, RDS data sources, ACM/Route53
for the custom domain, SSM, and SSO integration.

## Configuration

The API reads no secrets from source. It expects:

- a **Secrets Manager** secret with the DB connection (host/port/user/password),
  referenced by name/ARN in `terraform.tfvars`;
- **Auth0** domain / audience / client id values (in `terraform.tfvars`);
- an **ElastiCache** endpoint.

## API documentation

The `swagger/` function serves an OpenAPI definition. You can browse it with the
Swagger UI Docker image:

```bash
docker run -p 8889:8080 -e SWAGGER_JSON=/mnt/swagger.yml -v "$PWD":/mnt swaggerapi/swagger-ui
```

(You may hit CORS unless the gateway's CORS config includes your Swagger host.)
