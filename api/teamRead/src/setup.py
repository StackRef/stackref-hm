import setuptools

setuptools.setup(
  name = "teamRead",
  version = "1.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("teamRead AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_get_method.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
