import setuptools

setuptools.setup(
  name = "kickoffSQS",
  version = "0.1.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("kickoffSQS AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/create_codecommit_trigger.py',
    'stackref/create_team_analysis.py',
    'stackref/delete_team_analysis.py',
    'stackref/handle_messages.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
