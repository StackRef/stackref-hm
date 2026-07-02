import setuptools

setuptools.setup(
  name = "cloudAccountUserUpdate",
  version = "0.1.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("cloudAccountUserUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/aws_account_access.py',
    'stackref/process_post_method.py',
    'stackref/cache_functions.py',
    'stackref/process_cloud_account_user.py',
    'stackref/grant_functions.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
