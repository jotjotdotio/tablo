import { expectCapture, expectNoMatch } from './utils/expect';
import * as Parser from '../src/index';


describe('Headers', () => {
    it('matches the empty header', () => {
        expectCapture(Parser._header, {
            '=\n': [],
        });
    });

    it('matches single element headers', () => {
        expectCapture(Parser._header, {
            '-\n=\n': [null],
            '""\n=\n': [''],
            '"A"\n=\n': ['A'],
            '"Abc"\n=\n': ['Abc'],
            '"\\n"\n=\n': ['\n'],
        });
    });

    it('matches multi-element headers', () => {
        expectCapture(Parser._header, {
            '"", -\n=\n': ['', null],
            '-, -, -\n=\n': [null, null, null],
            '"A", "B", "C"\n=\n': ['A', 'B', 'C'],
            '"A", -, "Q", -\n=\n': ['A', null, 'Q', null],

        });
    });
});


describe('Row Data', () => {
    it('matches row separators', () => {
        expectCapture(Parser._row, {
            '~\n': Parser.Token.Tilde,
        })
    });
    
    it('matches null elements', () => {
        expectCapture(Parser._row, {
            '-\n': [null],
            '-\t\n': [null],
            '-    \n': [null],
            '-, -\n': [null, null],
            '-, -, -\n': [null, null, null],
        });
    });

    it('matches numeric elements', () => {
        expectCapture(Parser._row, {
            '1\n': [1],
            '4.7e5\t\n': [470000],
            '0xF5    \n': [0xF5],
            '1, 1.4\n': [1, 1.4],
            '0, 0.0, 0e0\n': [0, 0.0, 0.0],
        });
    });

    it('matches string elements', () => {
        expectCapture(Parser._row, {
            '"a"\n': ['a'],
            '"\\"foo\\""\t\n': ['"foo"'],
            '"0xF5"     \n': ["0xF5"],
            '"Caf\\u{e9}", "\\t"\n': ["Café", "\t"],
            '"0"\t,   "\\"\'\'\\""    ,    "eeeee"    \n': ['0', '"\'\'"', 'eeeee'],
        });
    });

    it('matches boolean elements', () => {
        expectCapture(Parser._row, {
            'true\n': [true],
            'false\t\t\n': [false],
            'true    ,   false     \n': [true, false],
            'false\t \t, \t false \t \n': [false, false],
            'true\t,   true    ,    true    \n': [true, true, true],
        });
    });

})


describe('Rejects malformed headers', () => {
    it('rejects malformed headers', () => {
        expectNoMatch(Parser._header, [
            '= \n', ' =\n', '\n=\n', '1\n=\n',
        ]);
    });
});
// describe('Data Rows', () => {
//     it('matches newlines', () => {
//         expectCapture(Parser._newline, {
//             '\n': Parser.Token.Newline,
//         });
//     });

//     it('matches open brace', () => {
//         expectCapture(Parser._openBrace, {
//             '{': Parser.Token.OpenBrace,
//             '{\t': Parser.Token.OpenBrace,
//             '{    ': Parser.Token.OpenBrace,
//         });
//     });

//     it('matches close brace', () => {
//         // Note: the scanner pattern for close brace
//         // expects a newline to immediately follow.
//         expectCapture(Parser._closeBrace, {
//             '}\n': Parser.Token.CloseBrace,
//             '}\t\n': Parser.Token.CloseBrace,
//             '}    \n': Parser.Token.CloseBrace,
//         });
//     });
// });


// describe('Format Rules', () => {
//     it('matches single cells', () => {
//         expectCapture(Parser._cellRange, {
//             '[A0]': 'A0',
//             '[ZZZ999]': 'ZZZ999',
//         });
//     });

//     it('matches single columns', () => {
//         expectCapture(Parser._cellRange, {
//             '[A]': 'A',
//             '[ZZZ]': 'ZZZ',
//         });
//     });

//     it('matches single rows', () => {
//         expectCapture(Parser._cellRange, {
//             '[0]': '0',
//             '[999]': '999',
//         });
//     });

//     it('matches column ranges', () => {
//         expectCapture(Parser._cellRange, {
//             '[A:A]': 'A:A',
//             '[A:ZZZ]': 'A:ZZZ',
//             '[QRS:TUV]': 'QRS:TUV',
//         });
//     });

//     it('matches row ranges', () => {
//         expectCapture(Parser._cellRange, {
//             '[0:0]': '0:0',
//             '[1:42]': '1:42'
//         });
//     });

//     it('matches rectangular selections', () => {
//         expectCapture(Parser._cellRange, {
//             '[A0:Z9]': 'A0:Z9',
//             '[B2:D20]': 'B2:D20'
//         });
//     });
// });