import setuptools

setuptools.setup(
  name = "kanbanUpdate",
  version = "1.1.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("kanbanUpdate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/create_kanban_item.py',
    'stackref/grant_functions.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
    'stackref/tator_notify.py',
    'stackref/update_kanban_item.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
