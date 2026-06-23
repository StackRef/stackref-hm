import setuptools

setuptools.setup(
  name = "eventRead",
  version = "1.2.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("eventRead AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/event_activity.py',
    'stackref/grant_functions.py',
    'stackref/judging_status.py',
    'stackref/process_get_method.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
