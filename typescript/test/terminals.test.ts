import { expectCapture, expectNoMatch } from './utils/expect';
import * as Parser from '../src/index';


describe('Values (happy cases)', () => {

    it('matches strings', () => {
        expectCapture(Parser._string, {
            '""': '',
            '"\\""': '\"',
            '"\'"': '\'',
            '"string"': 'string',
            '"\\n"': '\n',
            '"Caf\\u{E9}"': 'Café',
            '"Caf\\u{0E9}"': 'Café',
            '"Caf\\u{00E9}"': 'Café',
            '"Caf\\u{000E9}"': 'Café',
            '"Caf\\u{0000E9}"': 'Café',
            '"Caf\\u{00000E9}"': 'Café',
            '"Caf\\u{000000E9}"': 'Café',
            '"\0"': '\0',
            '""  ': '',
            '""\t': '', 
        });
    });
    
    it('matches integers', () => {
        expectCapture(Parser._int, {
            '0': 0,
            '000': 0,
            '-1': -1,
            '+1': 1,
            '2  ': 2,
            '3\t': 3,
            '+1_000_000': 1000000,
            '-9_876_543_210': -9876543210,
            '0000_0000_0000': 0,
        });
    });
    
    it('matches floats', () => {
        expectCapture(Parser._float, {
            '0.0': 0.0,
            '0.': 0.0,
            '000.': 0.0,
            '.0': 0.0,
            '.000': 0.0,
            '.01': 0.01,
            '0.01': 0.01,
            '+9.5': 9.5,
            '-1_234.567_8': -1234.5678,
        });
    });
    
    it('matches scientific notation', () => {
        expectCapture(Parser._scientific, {
            '0e0': 0.0,
            '0e1': 0.0,
            '1e1': 10,
            '+2e2': 200,
            '31e+2': 31e+2,
            '3.4e-3': 0.0034,
            '12.3e2': 1230,
            '-1_234.567_8e4': -12345678,
            '-1.234_567e-8': -1.234567e-8,
        });
    });

    it('matches hexadecimal', () => {
        expectCapture(Parser._hex, {
            '0x0': 0,
            '0x1': 1,
            '0xF5': 0xF5,
            '0xf5': 0xF5,
            '0x0000_0000': 0,
            '0xCAFE': 51966,
        });
    });

    it('matches booleans', () => {
        expectCapture(Parser._boolean, {
            'true': true,
            'true\t': true,
            'true       ': true,
            'false': false,
            'false\t': false,
            'false      ': false,
        });
    });

    it('matches null', () => {
        expectCapture(Parser._null, {
            '-': null,
            '-\t': null,
            '-     ': null,
        });
    });
});


describe('Tokens', () => {

    it('matches equals', () => {
        expectCapture(Parser._equals, {
            '=': Parser.Token.Equals,
        });
    });

    it('matches tilde', () => {
        expectCapture(Parser._tilde, {
            '~': Parser.Token.Tilde,
        });
    });

    it('matches star', () => {
        expectCapture(Parser._star, {
            '*': Parser.Token.Star,
        });
    });

    it('matches comma', () => {
        expectCapture(Parser._comma, {
            ',': Parser.Token.Comma,
            ',\t': Parser.Token.Comma,
            ',     ': Parser.Token.Comma,
        });
    });

    it('matches newlines', () => {
        expectCapture(Parser._newline, {
            '\n': Parser.Token.Newline,
        });
    });

    it('matches open brace', () => {
        expectCapture(Parser._openBrace, {
            '{': Parser.Token.OpenBrace,
            '{\t': Parser.Token.OpenBrace,
            '{    ': Parser.Token.OpenBrace,
        });
    });

    it('matches close brace', () => {
        // Note: the scanner pattern for close brace
        // expects a newline to immediately follow.
        expectCapture(Parser._closeBrace, {
            '}\n': Parser.Token.CloseBrace,
            '}\t\n': Parser.Token.CloseBrace,
            '}    \n': Parser.Token.CloseBrace,
        });
    });
});


describe('Ranges', () => {
    it('matches single cells', () => {
        expectCapture(Parser._cellRange, {
            '[A0]': 'A0',
            '[ZZZ999]': 'ZZZ999',
        });
    });

    it('matches single columns', () => {
        expectCapture(Parser._cellRange, {
            '[A]': 'A',
            '[ZZZ]': 'ZZZ',
        });
    });

    it('matches single rows', () => {
        expectCapture(Parser._cellRange, {
            '[0]': '0',
            '[999]': '999',
        });
    });

    it('matches column ranges', () => {
        expectCapture(Parser._cellRange, {
            '[A:A]': 'A:A',
            '[A:ZZZ]': 'A:ZZZ',
            '[QRS:TUV]': 'QRS:TUV',
        });
    });

    it('matches row ranges', () => {
        expectCapture(Parser._cellRange, {
            '[0:0]': '0:0',
            '[1:42]': '1:42'
        });
    });

    it('matches rectangular selections', () => {
        expectCapture(Parser._cellRange, {
            '[A0:Z9]': 'A0:Z9',
            '[B2:D20]': 'B2:D20'
        });
    });
});


describe('Properties', () => {
    it('matches style property names', () => {
        expectCapture(Parser._propName, {
            'plain': 'plain',
            'bold': 'bold',
            'italic': 'italic',
            'underline': 'underline',
            'strike': 'strike'
        });
    });

    it('matches font property names', () => {
        expectCapture(Parser._propName, {
            'normal': 'normal',
            'mono': 'mono',
        });
    });

    it('matches color property names', () => {
        expectCapture(Parser._propName, {
            'black': 'black',
            'red': 'red',
            'orange': 'orange',
            'yellow': 'yellow',
            'green': 'green',
            'blue': 'blue',
            'violet': 'violet',
            'grey': 'grey',
            'white': 'white',
        });
    });
});


describe('Values (rejections)', () => {
    it('rejects non-strings', () => {
        expectNoMatch(Parser._string, [
            '"', '"\n"', '@"', '-', 
        ]);
    });
    
    
    it('rejects non-integers', () => {
        expectNoMatch(Parser._int, [
            'a', '0__0', '3.', '.9', '#', '--', '+-', '+_0'
        ]);
    });

    it('rejects non-floats', () => {
        expectNoMatch(Parser._float, [
            '34,5', 'abc', '12', '0__0.0', '0.0__0'
        ]);
    });
    
    it('rejects unscientific notation', () => {
        expectNoMatch(Parser._scientific, [
            '0', '+-0', '0__0.0e0'
        ]);
    });

    it('rejects non-hexadecimal', () => {
        expectNoMatch(Parser._hex, [
            '0', '12', '12.3', '0xx0', 'CAFE', '0CAFE', '"0x00"'
        ]);
    })
});

describe('Ranges (rejections)', () => {
    it('rejects malformed range entries', () => {
        expectNoMatch(Parser._cellRange, [
            '[0A]', '[@]', '[]', '[:]', '[A 1]', '[A,B]', '[0:B]', '[B:0]',
            '[A1:0]', '[A1:Z]', '[A1:0A]', '[1A:A0]', '[1A:0A]', '[0:A1]',
            '[Z:A1]', '[D:20:A]'
        ]);
    });
});