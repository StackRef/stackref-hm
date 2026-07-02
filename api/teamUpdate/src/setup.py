import setuptools

setuptools.setup(
  name = "teamUpdate",
  version = "1.0.2",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("teamUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/delete_team_analysis.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/send_kickoff_action.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/team_external_link.py',
    'stackref/update_team.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
