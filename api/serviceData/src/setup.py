import setuptools

setuptools.setup(
  name = "serviceData",
  version = "0.0.6",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("serviceData AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_get_method.py',
    'stackref/process_post_method.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
