import setuptools

setuptools.setup(
  name = "set_cloud_account_clean",
  version = "1.0.0",
  author = "@gudlyf",
  author_email = "keith@stackref.com",
  description = ("Set cloud_account status to Clean"),
  license = "MIT",
  scripts=[
    '__init__.py',
    'main.py',
    'stackref/cache_functions.py',
    'stackref/settings.py',
  ],
  packages=setuptools.find_packages(),
  python_requires=">=3.12",
)
