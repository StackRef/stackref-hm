import setuptools

setuptools.setup(
  name = "kickoffRecordResults",
  version = "0.1.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
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
