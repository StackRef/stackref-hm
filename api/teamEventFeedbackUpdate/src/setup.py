import setuptools

setuptools.setup(
  name = "teamEventFeedbackUpdate",
  version = "1.0.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("teamEventFeedbackUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_post_method.py',
    'stackref/cache_functions.py',
    'stackref/update_team_event_feedback.py',
    'stackref/grant_functions.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
