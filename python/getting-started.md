# Development Guide

## Installing

1. Run `python -m pip install -r requirements.txt` to install all development dependencies

## Testing

1. Run `python -m unittest test` to run the test suite

## Building

1. Run `python setup.py sdist bdist_wheel` to build the source and binary
distributions

## Distributing

1. Run `twine upload -r testpypi dist/*` to upload build artifacts the
PyPI test environment
2. Verify that everything looks right
3. Run `twine upload dist/*` to upload build artifacts to PyPI
