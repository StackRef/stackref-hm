#!/usr/bin/env python3
"""
scrub.py — Sanitize identifying / sensitive values from the StackRef HM tree.

This script was used to prepare the original (private, multi-repo) StackRef
Hackathon Manager codebase for public open-source release. It is kept in the
repo for transparency: it documents exactly how the sanitization works and lets
anyone re-run / audit it.

It performs *text* replacements only. The genuinely dangerous artifacts
(Terraform state, .git history, real .env/.tfvars, private keys, vendored
dependencies) are excluded at copy time and never enter the tree — see
scripts/build_monorepo.sh.

Two layers of replacement:

  1. GENERIC credential patterns (defined below). These are regexes for the
     *shape* of a secret (AWS keys, Sentry DSNs, Stripe keys, Slack webhooks,
     Google OAuth credentials). They contain no real values and always run.

  2. TARGETED values (real account IDs, Auth0 client IDs, brand domains, the
     customer/personal handles). These live in scrub_targets.py, which is NOT
     committed — so the public repo never ships the very identifiers it scrubs.
     scrub_targets.example.py shows the structure. If scrub_targets.py is
     absent, only layer 1 runs.

Usage:
    python3 scripts/scrub.py <target_dir> [--check]

    --check : report occurrences only; make no changes (used for verification).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# --------------------------------------------------------------------------
# Layer 1: generic credential-shape patterns (safe to publish — no real values)
#   (label, is_regex, find, replace)
# --------------------------------------------------------------------------
GENERIC_REPLACEMENTS = [
    ("sentry-dsn", True,
     r"https://[a-f0-9]{32}@o\d+\.ingest\.sentry\.io/\d+",
     "https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT"),
    ("aws-access-key", True, r"A(KIA|SIA)[0-9A-Z]{16}", "AKIAXXXXXXXXXXXXXXXX"),
    ("slack-webhook", True, r"https://hooks\.slack\.com/services/[A-Za-z0-9/_-]+",
     "https://hooks.slack.com/services/REPLACE/WITH/WEBHOOK"),
    ("google-oauth-secret", True, r"GOCSPX-[A-Za-z0-9_-]+", "GOCSPX-YOUR_GOOGLE_OAUTH_SECRET"),
    ("google-client-id", True, r"\d{9,12}-[a-z0-9]{32}\.apps\.googleusercontent\.com",
     "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com"),
    # Placeholders are underscore-free so re-running is idempotent (the regex
    # alnum class stops at '_', which would otherwise duplicate the suffix).
    ("stripe-pk", True, r"pk_(test|live)_[A-Za-z0-9]+", "pk_test_YOURSTRIPEPUBLISHABLEKEY"),
    ("stripe-sk", True, r"(sk|rk)_(test|live)_[A-Za-z0-9]+", "sk_test_YOURSTRIPESECRETKEY"),
    ("stripe-whsec", True, r"whsec_[A-Za-z0-9]+", "whsec_YOURSTRIPEWEBHOOKSECRET"),
    ("stripe-pricetable", True, r"prctbl_[A-Za-z0-9]+", "prctbl_YOURPRICINGTABLE"),
]

SKIP_DIRS = {".git", "node_modules", ".venv", "venv", ".terraform", "build",
             "dist", "vendor", "package", ".chroma", "__pycache__"}
SKIP_FILES = {"scrub.py", "scrub_targets.py", "scrub_targets.example.py"}
SKIP_EXT = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf", ".woff",
            ".woff2", ".ttf", ".eot", ".zip", ".gz", ".lock"}


def build_rules():
    rules = []
    for label, is_regex, find, repl in GENERIC_REPLACEMENTS:
        rules.append((label, re.compile(find if is_regex else re.escape(find)), repl))

    # Layer 2: targeted real values, if the (uncommitted) targets module exists.
    try:
        import scrub_targets as t
    except ImportError:
        print("note: scrub_targets.py not found — running generic patterns only.")
        return rules

    for label, is_regex, find, repl in t.LITERAL_REPLACEMENTS:
        rules.append((label, re.compile(find if is_regex else re.escape(find)), repl))
    if getattr(t, "REAL_ACCOUNT_IDS", None):
        acct = re.compile(r"\b(" + "|".join(sorted(set(t.REAL_ACCOUNT_IDS))) + r")\b")
        rules.append(("aws-account-id", acct, "000000000000"))
    if getattr(t, "AUTH0_CLIENT_IDS", None):
        a0 = re.compile(r"\b(" + "|".join(sorted(set(t.AUTH0_CLIENT_IDS))) + r")\b")
        rules.append(("auth0-client-id", a0, "YOUR_AUTH0_CLIENT_ID"))
    return rules


def is_text(path):
    if os.path.splitext(path)[1].lower() in SKIP_EXT:
        return False
    try:
        with open(path, "rb") as f:
            chunk = f.read(4096)
        if b"\x00" in chunk:
            return False
        chunk.decode("utf-8")
        return True
    except (UnicodeDecodeError, OSError):
        return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    target = sys.argv[1]
    check_only = "--check" in sys.argv
    rules = build_rules()
    totals = {}
    files_changed = 0

    for root, dirs, files in os.walk(target):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name in SKIP_FILES:
                continue
            # Hand-authored secret placeholder templates intentionally resemble
            # the patterns we scrub; skip them to stay idempotent.
            if name.endswith(".secret.tfvars.example"):
                continue
            path = os.path.join(root, name)
            if not is_text(path):
                continue
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
            new = text
            file_hits = 0
            for label, pat, repl in rules:
                new, n = pat.subn(repl, new)
                if n:
                    totals[label] = totals.get(label, 0) + n
                    file_hits += n
            if file_hits and not check_only and new != text:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new)
                files_changed += 1
            elif file_hits and check_only:
                print(f"  [{file_hits:4d}] {os.path.relpath(path, target)}")

    print("\n=== Scrub summary ===")
    for label in sorted(totals):
        print(f"  {label:20s} {totals[label]}")
    if not totals:
        print("  (no matches — tree is clean)")
    if not check_only:
        print(f"\nFiles modified: {files_changed}")


if __name__ == "__main__":
    main()
