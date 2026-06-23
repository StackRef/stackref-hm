import setuptools

setuptools.setup(
  name = "organizationUpdate",
  version = "0.3.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("organizationUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/update_organization.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
