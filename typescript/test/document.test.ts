import { expectDocument } from './utils/expect';
import * as Parser from '../src/parse';
import { Table } from '../src/table';


describe('Documents', () => {
    it('matches the empty document', () => {
        expectDocument(Parser.document, {
            '= 0.1\n': [[], []],
        });
    });

    it('matches documents without headers', () => {
        expectDocument(Parser.document, {
            '=0.1\n1\n': [[], [[1]]],
            '=0.1\n1,2,3\n': [[], [[1, 2, 3]]],
            '=0.1\n1,2,3\n4,5,6\n': [[], [[1, 2, 3], [4, 5, 6]]]
        });
    });

    it('matches documents with headers', () => {
        expectDocument(Parser.document, {
            '"a"\n=0.1\n1\n': [['a'], [[1]]],
            '"a","b","c"\n=0.1\n1,2,3\n': [['a', 'b', 'c'], [[1, 2, 3]]],
            '"a","b",-\n=0.1\n1,2,3\n4,5,6\n': [['a', 'b', null], [[1, 2, 3], [4, 5, 6]]]
        });
    });

    it('matches single element headers', () => {
        expectDocument(Parser.document, {
            '-\n= 0.1\n': [[null], []],
            '""\n= 0.1\n': [[''], []],
            '"A"\n=0.1\n0.1\n': [['A'], [[0.1]]],
            '"Abc"\n=0.1\n0.1\n': [['Abc'], [[0.1]]],
            '"\\n"\n=0.1\n0.1\n': [['\n'], [[0.1]]],
        });
    });

    it('matches documents with section breaks', () => {
        expectDocument(Parser.document, {
            '"a"\n=0.1\n1\n2\n3\n~\n4\n5\n6\n': [['a'], [[1],[2],[3],[4],[5],[6]]],
            '"a","b","c"\n=0.1\n1,2,3\n~\n4,5,6\n': [['a', 'b', 'c'], [[1, 2, 3], [4, 5, 6]]],
            '"a","b",-\n=0.1\n1,2,3\n4,5,6\n7,8,9\n~\n10,11,12\n': [
                ['a', 'b', null], [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]
            ]
        });
    });

    it('returns an object of type `Table`', () => {
        const document = '"a", "b", "c"\n=0.1\n1, 2, 3\n4, 5, 6\n*\n';
        const [position, table, error] = Parser.document(document, 0);
        expect(error).toBeUndefined();
        expect(position).toEqual(document.length);
        expect(typeof table).toEqual('object');
        expect(table instanceof Table).toEqual(true);
        expect(table.get('A', 1)).toEqual(4);
        expect(table.get(0, 1)).toEqual(4);
        expect(table.get('B', 1)).toEqual(table.get(1, 1));
    });
});
