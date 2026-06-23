import setuptools

setuptools.setup(
  name = "Umpire",
  version = "0.0.1",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("Umpire AWS Lambda function"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/process_aws_config.py',
    'stackref/process_cloudtrail.py',
    'stackref/settings.py'
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
