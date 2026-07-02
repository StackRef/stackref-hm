import setuptools

setuptools.setup(
  name = "Umpire",
  version = "0.0.1",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
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
