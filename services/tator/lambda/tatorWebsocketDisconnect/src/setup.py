import setuptools

setuptools.setup(
  name = "tatorWebsocketDisconnect",
  version = "0.2.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("tatorWebsocketDisconnect AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/process_disconnect.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
