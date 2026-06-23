import setuptools

setuptools.setup(
  name = "eventCreate",
  version = "1.2.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("eventCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/assign_asset.py',
    'stackref/cache_functions.py',
    'stackref/create_event.py',
    'stackref/create_judging_criterion.py',
    'stackref/create_kickoff.py',
    'stackref/create_participants.py',
    'stackref/exceptions.py',
    'stackref/get_org_users.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
