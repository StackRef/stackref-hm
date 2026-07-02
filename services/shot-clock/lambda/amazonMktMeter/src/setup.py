import setuptools

setuptools.setup(
  name = "amazonMktMeter",
  version = "0.0.2",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("amazonMktMeter AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/process_metering.py',
    'stackref/settings.py',
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
