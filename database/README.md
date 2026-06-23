# database

The core **PostgreSQL** schema for StackRef HM, expressed as numbered DDL files
applied in order.

## Layout

Files are prefixed with a sequence number and applied **in ascending order**:

- `0001`–`0009` — roles and schemas
- `0010`–`0999` — tables, views, and functions for the two schemas
- `1001`–`1015` — later `ALTER`/`UPDATE` migrations
- `zload-test-data.sql` — optional demo/seed data (applied last)

The two schemas:

| Schema | Purpose |
|---|---|
| **`sr`** | The product domain — organizations, users & roles, events, participants, teams, cloud accounts, judging criteria, kanban, marketplace, coin/reward transactions, assets, Amazon Marketplace entitlement & metering, Stripe payments |
| **`coach`** | Guidance content — resources, playbooks, services |

There is also a generated schema doc under [`dbdoc/`](dbdoc/).

## Applying the schema

Apply every `*.sql` file in numeric order to a fresh database. A simple approach:

```bash
for f in $(ls -1 [0-9]*.sql | sort); do
  echo ">> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

# optional demo data
psql "$DATABASE_URL" -f zload-test-data.sql
```

The production project applied these through a migration tool (Flyway / Bytebase);
any tool that runs the files in filename order works. The numeric prefixes exist
precisely so ordering is unambiguous.

## Conventions

- One object per file, named `NNNN-<kind>-<schema>.<object>.sql`.
- The application database user is `sr_api`; an `sradmin` role owns the schema. Grants
  are applied by the `*-grants*.sql` migrations.

## Notes

- The seed data in `zload-test-data.sql` uses placeholder people and `@example.com`
  addresses.
- `psycopg`-based services expect this schema to already exist; deploy the database
  before the `api/` and `services/*` components.
