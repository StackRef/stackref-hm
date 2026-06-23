import setuptools

setuptools.setup(
  name = "organizationInvitation",
  version = "1.1.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("organizationInvitation AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/claim_invitation.py',
    'stackref/create_invitation.py',
    'stackref/email_invitation.py',
    'stackref/grant_functions.py',
    'stackref/invalidate_invitation.py',
    'stackref/process_get_method.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
