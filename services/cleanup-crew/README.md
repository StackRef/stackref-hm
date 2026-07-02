# services/cleanup-crew

**Team-account reset.** `cleanup-crew` wipes team AWS accounts clean between events so
they can be safely reused, while protecting the resources StackRef itself needs to
keep monitoring and running events.

## How it works

A Docker image that runs [**`aws-nuke`**](https://github.com/rebuy-de/aws-nuke) with a
guarded configuration:

- [`nuke-config.yml`](nuke-config.yml) — an allow/deny configuration that constrains
  nuking to **team accounts** and **filters out** required StackRef resources.
- [`docker/`](docker/) — the image definition.
- [`set_cloud_account_clean/`](set_cloud_account_clean/) — marks a cloud account as
  cleaned in the StackRef database afterward.
- [`cleanup_codecommit/`](cleanup_codecommit/) — removes team CodeCommit repositories
  and related analysis records.

> ⚠️ **This is destructive by design.** `aws-nuke` deletes resources. The
> configuration is scoped to team accounts, but review `nuke-config.yml` carefully and
> test against a throwaway account before using it for real.

## Build & run

```bash
cd docker
docker build -t stackref-cleanup-crew .
# run against a team account with appropriate (scoped) credentials, e.g.
docker run --rm -e AWS_PROFILE=<team-account> stackref-cleanup-crew
```

The original project built this image in CI and ran it as part of the event teardown
flow. See [`docs/architecture.md`](../../docs/architecture.md) for where it fits in
the event lifecycle.
