from hypothesis import given
from hypothesis.strategies import text

from tablo import parse


@given(text())
def test_decode_inverts_encode(s):
    input = f'"{s}"\n=0.1\n'
    offset, result, error = parse.header(input, 0)
    assert(result.header[0] == s)
