import setuptools

setuptools.setup(
  name = "userRegistration",
  version = "0.6.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("userRegistration AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/process_user.py',
    'stackref/register_user.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
