import setuptools

setuptools.setup(
  name = "Kickoff",
  version = "1.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("Kickoff AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/create_kanban_item.py',
    'stackref/form_event_teams.py',
    'stackref/handle_kickoff.py',
    'stackref/handle_messages.py',
    'stackref/send_kickoff_action.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
