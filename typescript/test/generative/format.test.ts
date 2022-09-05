import * as Parser from '../../src/parse';
import * as generators from './generators';
import {install} from 'jasmine-check';
install();


describe('Format', () => {
    const {gen, check} = (global || window as any);

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const genColumnAddr = gen.array(
        gen.oneOf(alphabet), {minSize: 1, maxSize:5}
    ).then(a => a.join(''));
    const genCellAddr = gen.array([genColumnAddr, gen.posInt]).then(a => a.join(''));

    const genColumnRange = gen.array([genColumnAddr, genColumnAddr]).then(a => a.join(':'));
    const genRowRange = gen.array([gen.posInt, gen.posInt]).then(a => a.join(':'));
    const genCellRange = gen.array([genCellAddr, genCellAddr]).then(a => a.join(':'));

    const genColumnFormats = gen.array(gen.array([
        genColumnRange, ' {normal}\n'
    ]).then(a => a.join(''))).then(a => '*\n' + a.join(''));

    check.it('cell range: columns', genColumnRange, (columns) => {
        const [offset, result, error] = Parser.cellRange(columns, 0);
        expect(result).toEqual(columns);
        expect(offset).toEqual(columns.length);
        expect(error).toBeUndefined();
    });

    check.it('cell range: rows', genRowRange, (rows) => {
        const [offset, result, error] = Parser.cellRange(rows, 0);
        expect(result).toEqual(rows);
        expect(offset).toEqual(rows.length);
        expect(error).toBeUndefined();
    });

    check.it('cell range: cells', genCellRange, (cells) => {
        const [offset, result, error] = Parser.cellRange(cells, 0);
        expect(result).toEqual(cells);
        expect(offset).toEqual(cells.length);
        expect(error).toBeUndefined();
    });

    check.it('format object: columns', genColumnFormats, (format) => {
        const [offset, result, error] = Parser.format(format, 0);
        expect(error).toBeUndefined();
        expect(offset).toEqual(format.length);
        //console.log(result);
    })
});
