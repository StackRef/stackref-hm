# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, use GitHub's **private vulnerability reporting**:
**Security → Report a vulnerability** on this repository. (Enable it under
*Settings → Code security → Private vulnerability reporting* if it isn't already.)

We will acknowledge the report, investigate, and coordinate a fix and disclosure
timeline with you.

## Reporting an exposed secret

This codebase was extracted and sanitized from a private commercial product (see
[docs/SANITIZATION.md](docs/SANITIZATION.md)). If you believe a real credential,
account identifier, private key, or other sensitive value slipped through the
sanitization, please report it privately as above rather than opening a public issue.

## Supported versions

This project is provided **as-is**. There is no formal support or backport policy;
fixes land on `main`.
