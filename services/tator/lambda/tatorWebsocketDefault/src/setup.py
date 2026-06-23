import setuptools

setuptools.setup(
  name = "tatorWebsocketDefault",
  version = "1.0.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("tatorWebsocketDefault AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/grant_functions.py',
    'stackref/handle_rooms.py',
    'stackref/process_message.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.11",
)
