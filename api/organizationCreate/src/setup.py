import setuptools

setuptools.setup(
  name = "organizationCreate",
  version = "1.0.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("organizationCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/coin_bank_transaction.py',
    'stackref/process_post_method.py',
    'stackref/create_organization.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
