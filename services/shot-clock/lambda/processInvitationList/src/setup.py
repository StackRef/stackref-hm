import setuptools

setuptools.setup(
  name = "processInvitationList",
  version = "1.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("processInvitationList AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/process_invitation_file.py'
    'stackref/settings.py',
    'stackref/tator_notify.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
