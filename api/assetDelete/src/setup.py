import setuptools

setuptools.setup(
  name = "assetDelete",
  version = "0.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("assetDelete AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/delete_asset.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
