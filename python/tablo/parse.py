from functools import reduce
import re
from enum import Enum

from tablo.combinators import concat, altern, repeat
from tablo.format import TableFormat
from tablo.table import Table


pattern = {
    'string': re.compile(r'"((?:[^"\n\r\b\\]|\\.)*)"[^\S\r\n]*'),
    'integer': re.compile(r'([+-]?(?:\d+_?)*\d+)[^\S\r\n]*'),
    'float': re.compile(r'([+-]?(?:(?:(?:0|[1-9](?:_?\d+)*)\.(?:(?:\d+_?)*\d+)?)|0\.|\.\d+))[^\S\r\n]*'),
    'hex': re.compile(r'([+-]?0x(?:[\dA-Fa-f]+_?)*[\dA-Fa-f]+)[^\S\r\n]*'),
    'exponent': re.compile(r'([+-]?(?:(?:0|[1-9](?:_?\d+)*\.(?:(?:\d+_?)*\d+)?)|0\.|\.\d+|(?:\d+_?)*\d+))[eE]([+-]?(?:\d+_?)*\d+)[^\S\r\n]*'),
    'date': re.compile(r'#(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?'),
    'time': re.compile(r'(\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{4}))?)?)?(Z|[+-]?\d{4})?'),
    'boolean': re.compile(r'(true|false)[^\S\r\n]*'),
    'null': re.compile(r'-[^\S\r\n]*'),

    'newline': re.compile(r'\n'),
    'comma': re.compile(r',[^\S\r\n]*'),
    'equals': re.compile(r'='),
    'tilde': re.compile(r'~'),
    'star': re.compile(r'\*'),
    'openBrace': re.compile(r'{[^\S\r\n]*'),
    'closeBrace': re.compile(r'}[^\S\r\n]*\n'),

    'version': re.compile(r' ?(\d+\.\d+)'),
    'cellRange': re.compile(r'((?:[A-Z]+[\d]+:[A-Z]+[\d]+)|(?:[A-Z]+:[A-Z]+)|(?:[\d]+:[\d]+)|(?:[A-Z]+[\d]+))[^\S\r\n]'),
    'tag': re.compile(r'([A-Za-z_][A-Za-z0-9_-]*)[^\S\r\n]*'),
    'propName': re.compile(r'(plain|bold|italic|underline|strike|normal|mono|black|red|orange|yellow|green|blue|violet|grey|white)[^\S\r\n]*'),
}

class Token(Enum):
    Equals = '='
    Tilde = '~'
    Star = '*'
    Comma = ','
    Newline = '\n'
    OpenBrace = '{'
    CloseBrace = '}'


def document(input: str, offset: int):
    offset, head, error = header(input, offset)

    if error:
        return (offset, None, error)

    offset, table, error = data(input, offset)

    if error:
        return (offset, None, error)
    
    table.header = head

    if offset == len(input):
        return (offset, table, None)
    
    offset, table.format, error = format(input, offset)

    if error:
        return (offset, None, error)

    return (offset, table, None)

def header(input: str, offset: int):
    def headerLine(input: str, offset: int):
        offset, elt, error = label(input, offset)

        if error: return (offset, [], None)

        offset, matched, error = concat(
            repeat(comma, label), newline
        )(input, offset)

        if error: return (offset, None, error)

        labels = filter(lambda elt: elt not in (Token.Comma, Token.Newline), matched)
        return (offset, [elt] + labels, None)

    start = offset
    offset, elts, error = headerLine(input, offset)

    if error: return (offset, None, error)

    offset, verNumber, error = concat(equals, version, newline)(input, offset)

    if error:
        return (start, None, error)
    elif verNumber[1] != '0.1':
        return (start, None, 'invalid version number')
    else:
        return (offset, elts, None)

def data(input: str, offset: int):
    offset, rows, error = repeat(row)(input, offset)

    if error:
        return (offset, None, error)
    else:
        def process(result, elt):
            count, rows, breaks = result
            
            if elt == Token.Tilde:
                breaks.append(count)
            else:
                count += 1
                rows.append(elt)

            return (count, rows, breaks)

        _count, result, breaks = reduce(process, rows, (0, [], []))

        table = Table(None, result, TableFormat())
        table.breaks = breaks
        return (offset, table, None)

def format(input: str, offset: int):
    offset, _ignore, errors = concat(star, newline)(input, offset)

    if errors:
        return (offset, None, errors)

    return formatRules(input, offset)

def formatRules(input: str, offset: int):
    offset, lines, error = repeat(formatRule)(input, offset)

    if error:
        return (offset, None, error)
    elif offset != len(input):
        return (offset, None, 'format rule')

    rules = {}

    for key, props in lines:
        if key in rules:
            rules[key] += props
        else:
            rules[key] = props

    return (offset, TableFormat(rules), None)

def formatRule(input: str, offset: int):
    offset, result, error = concat(cellRange, properties)(input, offset)

    if error:
        return (offset, None, error)
    else:
        return (offset, (result[0], result[1:]), None)

def cellRange(input: str, offset: int):
    if match := pattern['cellRange'].match(input, offset):
        return (match.end(), match.groups()[0], None)
    else:
        return (offset, None, 'cell range')

def properties(input: str, offset: int):
    position, props, error = concat(
        openBrace,
        concat(tag, repeat(comma, tag)),
        closeBrace
    )(input, offset)

    if error:
        return (position, None, error)
    else:
        filtered = filter(lambda prop: prop is not Token.Comma, props[1:-1])
        return (position, filtered, None)

def row(input: str, offset: int):
    position, rowData, error = altern(
        concat(element, repeat(comma, element), newline),
        concat(tilde, newline)
    )(input, offset)

    if error:
        return (position, None, "element or '~'")
    elif rowData and rowData[0] is Token.Tilde:
        return (position, Token.Tilde, None)
    else:
        filtered = filter(lambda elt: elt not in (Token.Comma, Token.Newline), rowData)
        return (position, list(filtered), None)

def element(input: str, offset: int):
    return altern(stringValue, number, booleanValue, nullValue)(input, offset)

def label(input: str, offset: int):
    return altern(stringValue, nullValue)(input, offset)

def equals(input: str, offset: int):
    if match := pattern['equals'].match(input, offset):
        return (match.end(), Token.Equals, None)
    else:
        return (offset, None, 'header separator')

def star(input: str, offset: int):
    if match := pattern['star'].match(input, offset):
        return (match.end(), Token.CloseBrace, None)
    else:
        return (offset, None, 'format separator')

def tilde(input: str, offset: int):
    if match := pattern['tilde'].match(input, offset):
        return (match.end(), Token.Tilde, None)
    else:
        return (offset, None, 'section separator')

def comma(input: str, offset: int):
    if match := pattern['comma'].match(input, offset):
        return (match.end(), Token.Comma, None)
    else:
        return (offset, None, 'comma')

def newline(input: str, offset: int):
    if match := pattern['newline'].match(input, offset):
        return (match.end(), Token.Newline, None)
    else:
        return (offset, None, 'newline')

def openBrace(input: str, offset: int):
    if match := pattern['openBrace'].match(input, offset):
        return (match.end(), Token.OpenBrace, None)
    else:
        return (offset, None, '"{"')

def closeBrace(input: str, offset: int):
    if match := pattern['closeBrace'].match(input, offset):
        return (match.end(), Token.CloseBrace, None)
    else:
        return (offset, None, '"}"')

def version(input: str, offset: int):
    if match := pattern['version'].match(input, offset):
        return (match.end(), match.groups()[0], None)
    else:
        return (offset, None, 'version number')
        
def tag(input: str, offset: int):
    if match := pattern['propName'].match(input, offset):
        return (match.end(), match.groups()[0], None)
    else:
        return (offset, None, 'Format Property')

def stringValue(input: str, offset: int):
    escapes = re.compile(r'\\["ntfrb\\]|\\u\{([0-9A-Fa-f]{1,8})\}')

    def replace(match):
        if codepoint := match.groups():
            return chr(int(codepoint[0], 16))
        else:
            chars = {
                r'\"': '\"',
                r'\n': '\n',
                r'\t': '\t',
                r'\f': '\f',
                r'\r': '\r',
                r'\b': '\b',
                r'\\': '\\'
            }
            return chars[match.string]

    if match := pattern['string'].match(input, offset):
        value = escapes.sub(replace, match.groups()[0])
        return (match.end(), value, None)
    else:
        return (offset, None, 'string')

def number(input: str, offset: int):
    return altern(scientific, hexValue, floatValue, intValue)(input, offset)

def scientific(input: str, offset: int):
    if match := pattern['exponent'].match(input, offset):
        mantissa = match.groups()[0].replace('_', '')
        exponent = match.groups()[1].replace('_', '')
        return (match.end(), float(f'{mantissa}e{exponent}'), None)
    else:
        return (offset, None, 'scientific')

def floatValue(input: str, offset: int):
    if match := pattern['float'].match(input, offset):
        value = match.groups()[0].replace('_', '')
        return (match.end(), float(value), None)
    else:
        return (offset, None, 'float')

def intValue(input: str, offset: int):
    if match := pattern['integer'].match(input, offset):
        value = match.groups()[0].replace('_', '')
        return (match.end(), int(value), None)
    else:
        return (offset, None, 'integer')

def hexValue(input: str, offset: int):
    if match := pattern['hex'].match(input, offset):
        value = match.groups()[0].replace('0x', '', 1).replace('_', '')
        return [match.end(), int(value, 16), None]
    else:
        return (offset, None, 'hexadecimal')

def booleanValue(input: str, offset: int):
    if match := pattern['boolean'].match(input, offset):
        value = match.groups()[0] == 'true'
        return (match.end(), value, None)
    else:
        return (offset, None, 'boolean')

def nullValue(input: str, offset: int):
    if match := pattern['null'].match(input, offset):
        return (match.end(), None, None)
    else:
        return (offset, None, 'null')
