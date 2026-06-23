import setuptools

setuptools.setup(
  name = "participantRead",
  version = "0.3.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("participantRead AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/get_user_participants.py',
    'stackref/grant_functions.py',
    'stackref/process_get_method.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
