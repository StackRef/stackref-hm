import setuptools

setuptools.setup(
  name = "getUser",
  version = "0.0.3",
  author = "@JordanAvery",
  author_email = "admin@example.com",
  description = ("getUser AWS Lambda function via API Gateway"),
  license = "MIT",
  scripts=[
    'main.py',
    'stackref/process_post_method.py',
    'stackref/settings.py',
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.9",
)
