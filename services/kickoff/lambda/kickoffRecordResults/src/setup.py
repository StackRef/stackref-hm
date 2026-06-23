import setuptools

setuptools.setup(
  name = "kickoffRecordResults",
  version = "0.1.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("kickoffCodeScan AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/handle_codecommit.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
