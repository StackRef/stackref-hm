import setuptools

setuptools.setup(
  name = "coinBankUpdate",
  version = "1.0.2",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("coinBankUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/process_fn_method.py',
    'stackref/process_post_method.py',
    'stackref/update_coin_bank.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
