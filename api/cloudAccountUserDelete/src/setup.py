import setuptools

setuptools.setup(
  name = "cloudAccountUserDelete",
  version = "0.1.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("cloudAccountUserDelete AWS Lambda function via API Gateway"),
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
