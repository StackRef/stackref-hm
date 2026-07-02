import setuptools

setuptools.setup(
  name = "tatorWebsocketEventBridge",
  version = "1.0.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("tatorWebsocketEventBridge AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/cloud_account.py',
    'stackref/coin_bank_transaction.py',
    'stackref/grant_functions.py',
    'stackref/handle_ec2_resources.py',
    'stackref/handle_messages.py',
    'stackref/process_aws_config.py',
    'stackref/process_eventbridge_event.py',
    'stackref/process_umpire_event.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
