import setuptools

setuptools.setup(
  name = "assetCreate",
  version = "1.1.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("assetCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/create_asset.py',
    'stackref/exceptions.py',
    'stackref/generate_image.py',
    'stackref/grant_functions.py',
    'stackref/process_fn_method.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
