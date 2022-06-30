import * as Parser from '../../src/parse';
import * as generators from './generators';
import {install} from 'jasmine-check';
import { join } from 'path';
install();


describe('Data', () => {
    const {gen, check} = (global || window as any);

    const genNullArray = gen.array(generators.genNull, {minSize: 1});
    const genBoolArray = gen.array(generators.genBool, {minSize: 1});
    const genIntArray = gen.array(generators.genInt, {minSize: 1});
    const genHexArray = gen.array(generators.genHex, {minSize: 1});
    const genFloatArray = gen.array(generators.genFloat, {minSize: 1});
    const genScientificArray = gen.array(generators.genScientific, {minSize: 1});

    const genHeterogeneousArray = gen.array(gen.array([
        gen.array(gen.oneOf([' ', '\t']), {maxSize: 5}).then(a => a.join('')),
        generators.genValue,
    ]).then(a => a.join('')), {minSize: 1});

    check.it('null arrays', genNullArray, (arr) => {
        const input = arr.join(',') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => null));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('bool arrays', genBoolArray, (arr) => {
        const input = arr.join(', ') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => a === 'true'));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
    
    check.it('integer arrays', genIntArray, (arr) => {
        const input = arr.join(',\t') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => parseInt(a.replace(/_/g, ''), 10)));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
    
    check.it('hex arrays', genHexArray, (arr) => {
        const input = arr.join(',\t') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => parseInt(a.replace(/_|0x/g, ''), 16)));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
    
    check.it('float arrays', genFloatArray, (arr) => {
        const input = arr.join(',') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => parseFloat(a.replace(/_/g, ''))));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
    
    check.it('scientific arrays', genScientificArray, (arr) => {
        const input = arr.join(',') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(result.length).toEqual(arr.length);
        expect(result).toEqual(arr.map(a => parseFloat(a.replace(/_/g, ''))));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
    
    check.it('heterogeneous arrays', genHeterogeneousArray, (arr) => {
        const input = arr.join(',').replace(/[ \t]+/, '') + '\n';
        const [offset, result, error] = Parser.row(input, 0);
        expect(error).toBeUndefined();
        expect(result.length).toEqual(arr.length);
        expect(offset).toEqual(input.length);
    });
});
