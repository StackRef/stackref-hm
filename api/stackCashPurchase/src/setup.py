import setuptools

setuptools.setup(
  name = "stackCashPurchase",
  version = "1.0.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("stackCashPurchase AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/amzn_marketplace.py',
    'stackref/cache_functions.py',
    'stackref/coin_bank_transaction.py',
    'stackref/grant_functions.py',
    'stackref/process_amazon.py',
    'stackref/process_post_method.py',
    'stackref/process_purchase.py',
    'stackref/process_stripe.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
