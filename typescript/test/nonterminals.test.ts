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

    it('rejects malformed headers', () => {
        expectNoMatch(Parser._header, [
            '= \n', ' =\n', '\n=\n', '1\n=\n',
        ]);
    });
});


describe('Single Rows', () => {
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

    it('matches heterogeneous elements', () => {
        expectCapture(Parser._row, {
            '1, "2", -, true\n': [1, '2', null, true],
            '-, 0xCAFE, "don\'t panic", false\n': [null, 51966, "don't panic", false],
        });
    });
});


describe('Row Data', () => {

    it('matches a single row', () => {
        expectCapture(Parser._data, {
            '~\n': [[], []],
            '-\n~\n-\n': [[[null]], [[null]]],
        });
    });
    
    it('matches multiple rows', () => {
        expectCapture(Parser._data, {
            '1\n2\n3\n4\n': [[[1], [2], [3], [4]]],
            '1, 2, 3\n4, 5, 6\n7, 8, 9\n': [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
            '1, 2, 3\n-, -, -\n1, 2, 3\n': [[[1, 2, 3], [null, null, null], [1, 2, 3]]],
        });
    });

    it('matches group separators', () => {
        expectCapture(Parser._data, {
            '"a", "b"\n1, 2\n~\n"c", "d"\n3, 4\n': [[['a', 'b'], [1, 2]], [['c', 'd'], [3, 4]]],

        });
    });
});


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