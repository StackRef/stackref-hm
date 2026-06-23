# scripts

Tooling used to build and sanitize this public repository from StackRef HM's original
private, multi-repo codebase. Kept for transparency and reproducibility. See
[`docs/SANITIZATION.md`](../docs/SANITIZATION.md) for the full rationale.

| File | Purpose |
|---|---|
| `build_monorepo.sh` | Copies **source only** from the original repos into this monorepo layout, excluding git history, Terraform state, real env/tfvars, key material, vendored deps, and build artifacts. |
| `scrub.py` | Replaces identifying/sensitive values with placeholders. Runs generic credential-shape patterns always; applies targeted real-value replacements if `scrub_targets.py` is present. Idempotent. |
| `scrub_targets.example.py` | Template for `scrub_targets.py`. |
| `scrub_targets.py` | **Not committed** (gitignored). The real list of account IDs, client IDs, domains, and PII that were replaced. |

## Verify the tree is clean

```bash
python3 scripts/scrub.py . --check     # reports any remaining identifying values
```

`--check` makes no changes. Without a local `scrub_targets.py`, only the generic
credential patterns are checked.
