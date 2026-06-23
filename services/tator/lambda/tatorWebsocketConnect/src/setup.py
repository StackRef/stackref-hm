import setuptools

setuptools.setup(
  name = "tatorWebsocketConnect",
  version = "0.1.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("tatorWebsocketConnect AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/process_connection.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
