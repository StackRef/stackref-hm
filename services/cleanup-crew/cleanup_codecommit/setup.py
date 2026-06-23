import setuptools

setuptools.setup(
  name = "cleanup_codecommit",
  version = "1.0.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("Remove IAM and CodeCommit stuff for provided event_uuid"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/delete_teams_analysis.py',
    'stackref/settings.py',
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.12",
)
