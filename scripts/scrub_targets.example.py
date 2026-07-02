"""
scrub_targets.example.py — template for scrub_targets.py.

Copy to scrub_targets.py and fill in the real deployment-specific values you
want replaced. scrub_targets.py is gitignored so these never get committed.
The values below are illustrative placeholders, not real.
"""

# Real AWS account IDs to collapse to the all-zero placeholder.
REAL_ACCOUNT_IDS = [
    "123456789012",
    "210987654321",
]

# Real Auth0 application client IDs to replace.
AUTH0_CLIENT_IDS = [
    "ExampleAuth0SpaClientId0000000000",
    "ExampleAuth0ApiClientId0000000000",
]

# Ordered literal/regex replacements: (label, is_regex, find, replace)
LITERAL_REPLACEMENTS = [
    ("sentry-key", False, "0123456789abcdef0123456789abcdef", "YOUR_SENTRY_KEY"),
    ("gtm", False, "GTM-EXAMPLE", "GTM-XXXXXXX"),
    ("ga", False, "G-EXAMPLE000", "G-XXXXXXXXXX"),

    # Customer / personal handles (substring match catches snake_case too)
    ("customer-name", False, "yourcustomer", "acme"),
    ("personal-handle", False, "yourhandle", "demo"),

    # Operational domains, specific before generic
    ("sso-portal", False, "yourorg.awsapps.com", "example-sso.awsapps.com"),
    ("auth0-tenant", False, "yourorg.us.auth0.com", "example.us.auth0.com"),
    ("domain-com", False, "yourdomain.com", "example.com"),
]
