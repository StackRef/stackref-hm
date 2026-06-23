import setuptools

setuptools.setup(
  name = "eventUpdate",
  version = "1.0.5",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("eventUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/active_event_update.py',
    'stackref/archive_event.py',
    'stackref/archive_teams.py',
    'stackref/aws_account_access.py',
    'stackref/cache_functions.py',
    'stackref/delete_team_analysis.py',
    'stackref/grant_functions.py',
    'stackref/process_fn_method.py',
    'stackref/process_post_method.py',
    'stackref/send_kickoff_action.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/unassign_cloud_accounts.py',
    'stackref/update_event.py',
    'stackref/update_kickoff.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
