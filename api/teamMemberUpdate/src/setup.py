import setuptools

setuptools.setup(
  name = "teamMemberUpdate",
  version = "1.1.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("teamMemberUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_fn_method.py',
    'stackref/process_post_method.py',
    'stackref/tator_notify.py',
    'stackref/update_team_member.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
