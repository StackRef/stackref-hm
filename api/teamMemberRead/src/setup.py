import setuptools

setuptools.setup(
  name = "teamMemberRead",
  version = "0.3.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("teamMemberRead AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/get_team_members.py',
    'stackref/grant_functions.py',
    'stackref/process_get_method.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
