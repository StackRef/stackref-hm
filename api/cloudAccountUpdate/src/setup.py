import setuptools

setuptools.setup(
  name = "cloudAccountUpdate",
  version = "0.2.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("cloudAccountUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/aws_account_access.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/update_cloud_account.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
