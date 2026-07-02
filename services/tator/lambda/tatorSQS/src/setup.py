import setuptools

setuptools.setup(
  name = "tatorSQS",
  version = "1.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("tatorSQS AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/coin_bank_transaction.py',
    'stackref/grant_functions.py',
    'stackref/handle_messages.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
