import pathlib
from setuptools import setup, find_packages


BASE_DIR = pathlib.Path(__file__).parent

config = {
    'name': 'tablo-fyi',
    'version': '0.4.5',
    'description': "A tabular data format that doesn't make you want to pull your hair out",
    'long_description': (BASE_DIR / "README.md").read_text(),
    'long_description_content_type': 'text/markdown',
    'author': 'Brendan Berg',
    'author_email': 'brendan@berg.industries',
    'license': 'MIT',
    'url': 'https://github.com/jotjotdotio/tablo',
    'install_requires': [],
    'packages': find_packages()
}

setup(**config)
