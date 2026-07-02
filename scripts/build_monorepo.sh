#!/usr/bin/env bash
#
# build_monorepo.sh — Assemble the public stackref-hm monorepo from the original
# (private) per-component repositories.
#
# This is kept for transparency. It copies SOURCE ONLY: git history, Terraform
# state, vendored dependencies, build output, real env/tfvars, and key material
# are excluded here and never enter the public tree. A separate pass
# (scripts/scrub.py) then replaces identifying values with placeholders.
#
# Usage:  SRC=/path/to/private/repos ./scripts/build_monorepo.sh
#
set -euo pipefail

SRC="${SRC:-..}"                                   # dir holding the 11 source repos
DEST="$(cd "$(dirname "$0")/.." && pwd)"           # the monorepo root (this repo)

# source-repo -> destination-subdir
MAP=(
  "primary-frontend:frontend"
  "api-lambda:api"
  "database-ddls:database"
  "tator:services/tator"
  "kickoff:services/kickoff"
  "shot-clock:services/shot-clock"
  "umpire:services/umpire"
  "cleanup-crew:services/cleanup-crew"
  "cossell-ai:ai"
  "auth0-configuration:auth0"
  "terraform:infra"
)

EXCLUDES=(
  --exclude '.git/'
  --exclude '.gitlab/'
  --exclude '.gitlab-ci.yml'        # GitLab-specific; build/deploy documented in READMEs
  --exclude '.vscode/'
  --exclude 'node_modules/'
  --exclude '.venv/' --exclude 'venv/'
  --exclude '.terraform/'
  --exclude '.terraform.lock.hcl'
  --exclude '*.tfstate' --exclude '*.tfstate.*'
  --exclude 'build/' --exclude 'dist/'
  --exclude '.chroma/'
  --exclude 'payload/' --exclude 'payload.zip' --exclude '*.zip'
  --exclude 'package/'              # vendored python lambda-layer site-packages
  --exclude 'vendor/'              # vendored python deps
  --exclude '*.pem' --exclude '*.key' --exclude '*.p12' --exclude '*.pub'
  --exclude 'tfws-*.json'          # GCP service-account key files
  --exclude '.env' --exclude '.env.*'   # real env files; .example generated separately
  --exclude '*.tfvars'             # real tfvars; .example versions generated separately
  --exclude 'sbom.json'
  --exclude '.dccache' --exclude '.DS_Store'
  --exclude '.infracost/'
  --exclude '.snyk'
  --exclude '.opencommitignore'
)

for entry in "${MAP[@]}"; do
  src="${SRC}/${entry%%:*}"
  dst="${DEST}/${entry##*:}"
  echo ">> ${entry%%:*} -> ${entry##*:}"
  mkdir -p "$dst"
  rsync -a "${EXCLUDES[@]}" "$src/" "$dst/"
done

echo ">> copy complete. Next: python3 scripts/scrub.py ."
