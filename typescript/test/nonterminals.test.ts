import { expectCapture, expectNoMatch } from './utils/expect';
import * as Parser from '../src/parse';
import { Table } from '../src/table';


describe('Headers', () => {
    it('matches the empty header', () => {
        expectCapture(Parser.header, {
            '= 0.1\n': [],
        });
    });

    it('matches single element headers', () => {
        expectCapture(Parser.header, {
            '-\n= 0.1\n': [null],
            '""\n= 0.1\n': [''],
            '"A"\n=0.1\n': ['A'],
            '"Abc"\n=0.1\n': ['Abc'],
            '"\\n"\n=0.1\n': ['\n'],
        });
    });

    it('matches multi-element headers', () => {
        expectCapture(Parser.header, {
            '"", -\n= 0.1\n': ['', null],
            '-, -, -\n= 0.1\n': [null, null, null],
            '"A", "B", "C"\n= 0.1\n': ['A', 'B', 'C'],
            '"A", -, "Q", -\n= 0.1\n': ['A', null, 'Q', null],

        });
    });

    it('rejects malformed headers', () => {
        expectNoMatch(Parser.header, [
            '= 0.1 \n', ' =0.1\n', '\n=0.1\n', '1\n=0.1\n',
            '=\n', '= \n', '\n=\n', '\n= \n'
        ]);
    });
});


describe('Single Rows', () => {
    it('matches row separators', () => {
        expectCapture(Parser.row, {
            '~\n': Parser.Token.Tilde,
        })
    });
    
    it('matches null elements', () => {
        expectCapture(Parser.row, {
            '-\n': [null],
            '-\t\n': [null],
            '-    \n': [null],
            '-, -\n': [null, null],
            '-, -, -\n': [null, null, null],
        });
    });

    it('matches numeric elements', () => {
        expectCapture(Parser.row, {
            '1\n': [1],
            '4.7e5\t\n': [470000],
            '0xF5    \n': [0xF5],
            '1, 1.4\n': [1, 1.4],
            '0, 0.0, 0e0\n': [0, 0.0, 0.0],
        });
    });

    it('matches string elements', () => {
        expectCapture(Parser.row, {
            '"a"\n': ['a'],
            '"\\"foo\\""\t\n': ['"foo"'],
            '"0xF5"     \n': ["0xF5"],
            '"Caf\\u{e9}", "\\t"\n': ["Café", "\t"],
            '"0"\t,   "\\"\'\'\\""    ,    "eeeee"    \n': ['0', '"\'\'"', 'eeeee'],
        });
    });

    it('matches boolean elements', () => {
        expectCapture(Parser.row, {
            'true\n': [true],
            'false\t\t\n': [false],
            'true    ,   false     \n': [true, false],
            'false\t \t, \t false \t \n': [false, false],
            'true\t,   true    ,    true    \n': [true, true, true],
        });
    });

    it('matches heterogeneous elements', () => {
        expectCapture(Parser.row, {
            '1, "2", -, true\n': [1, '2', null, true],
            '-, 0xCAFE, "don\'t panic", false\n': [null, 51966, "don't panic", false],
        });
    });
});


describe('Row Data', () => {

    it('matches a single row', () => {
        const emptyTable = new Table(null, []);
        emptyTable.breaks = [0];

        const nonEmptyTable = new Table(null, [[null], [null]]);
        nonEmptyTable.breaks = [1];

        expectCapture(Parser.data, {
            '~\n': emptyTable,
            '-\n~\n-\n': nonEmptyTable,
        });
    });
    
    it('matches multiple rows', () => {
        expectCapture(Parser.data, {
            '1\n2\n3\n4\n': new Table(null, [[1], [2], [3], [4]]),
            '1, 2, 3\n4, 5, 6\n7, 8, 9\n': new Table(null, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]),
            '1, 2, 3\n-, -, -\n1, 2, 3\n': new Table(null, [[1, 2, 3], [null, null, null], [1, 2, 3]]),
        });
    });

    it('matches group separators', () => {
        const table = new Table(null, [['a', 'b'], [1, 2], ['c', 'd'], [3, 4]]);
        table.breaks = [2];
        
        expectCapture(Parser.data, {
            '"a", "b"\n1, 2\n~\n"c", "d"\n3, 4\n': table,
        });
    });
});


describe('Format Rules', () => {
    it('matches single cells', () => {
        expectCapture(Parser.cellRange, {
            'A0': 'A0',
            'ZZZ999': 'ZZZ999',
        });
    });

    it('matches column ranges', () => {
        expectCapture(Parser.cellRange, {
            'A:A': 'A:A',
            'A:ZZZ': 'A:ZZZ',
            'QRS:TUV': 'QRS:TUV',
        });
    });

    it('matches row ranges', () => {
        expectCapture(Parser.cellRange, {
            '0:0': '0:0',
            '1:42': '1:42'
        });
    });

    it('matches rectangular selections', () => {
        expectCapture(Parser.cellRange, {
            'A0:Z9': 'A0:Z9',
            'B2:D20': 'B2:D20'
        });
    });

    it('rejects single columns', () => {
        expectNoMatch(Parser.cellRange, ['A', 'ZZZ']);
    });

    it('rejects single rows', () => {
        expectNoMatch(Parser.cellRange, ['0', '999']);
    });
});
