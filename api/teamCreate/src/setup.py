import setuptools

setuptools.setup(
  name = "teamCreate",
  version = "1.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("teamCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_post_method.py',
    'stackref/cache_functions.py',
    'stackref/create_team.py',
    'stackref/create_team_analysis.py',
    'stackref/grant_functions.py',
    'stackref/send_kickoff_action.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
