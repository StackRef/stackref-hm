import setuptools

setuptools.setup(
  name = "amznMarketplaceEntitlement",
  version = "0.0.2",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("amznMarketplaceEntitlement AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/amzn_marketplace.py',
    'stackref/cache_functions.py',
    'stackref/coin_bank_transaction.py',
    'stackref/grant_functions.py',
    'stackref/process_entitlement.py',
    'stackref/process_get_method.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/update_entitlement.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
