import setuptools

setuptools.setup(
  name = "judgingCriterionCreate",
  version = "0.1.0",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("judgingCriterionCreate AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_post_method.py',
    'stackref/cache_functions.py',
    'stackref/create_judging_criterion.py',
    'stackref/grant_functions.py',
    'stackref/settings.py',
    'stackref/auth0/auth0_jwt.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
