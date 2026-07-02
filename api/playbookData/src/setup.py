import setuptools

setuptools.setup(
  name = "playbookData",
  version = "0.0.8",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("playbookData AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_get_method.py'
    'stackref/process_playbooks.py'
    'stackref/process_post_method.py',
    'stackref/process_resources.py',
    'stackref/process_services.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
