import setuptools

setuptools.setup(
  name = "participantCreate",
  version = "0.4.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("participantCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_post_method.py',
    'stackref/cache_functions.py',
    'stackref/create_participant.py',
    'stackref/grant_functions.py',
    'stackref/settings.py',
    'stackref/event_attend_request.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
