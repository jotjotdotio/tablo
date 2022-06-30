import * as Parser from '../../src/parse';
import * as generators from './generators';
import {install} from 'jasmine-check';
install();


describe('Headers', () => {
    const {gen, check} = (global || window as any);

    const genNullArray = gen.array(generators.genNull, {minSize: 1});
    const genStringArray = gen.array(generators.genString, {minSize: 1});

    const genHeterogeneousArray = gen.array(gen.array([
        gen.array(gen.oneOf([' ', '\t']), {maxSize: 5}).then(a => a.join('')),
        gen.oneOf([generators.genNull, generators.genString])
    ]).then(a => a.join('')), {minSize: 1});

    check.it('null arrays', genNullArray, (arr) => {
        const input = arr.join(',') + '\n=0.1\n';
        const [offset, result, error] = Parser.header(input, 0);
        expect(error).toBeUndefined();
        expect(result.length).toEqual(arr.length);
        expect(offset).toEqual(input.length);
    });

    check.it('string arrays', genStringArray, (arr) => {
        const input = arr.join(', ') + '\n=0.1\n';
        const [offset, result, error] = Parser.header(input, 0);
        expect(error).toBeUndefined();
        expect(result.length).toEqual(arr.length);
        expect(offset).toEqual(input.length);
    });

    check.it('heterogeneous arrays', genHeterogeneousArray, (arr) => {
        const input = arr.join(',').replace(/[ \t]+/, '') + '\n=0.1\n';
        const [offset, result, error] = Parser.header(input, 0);
        expect(error).toBeUndefined();
        expect(result.length).toEqual(arr.length);
        expect(offset).toEqual(input.length);
    });
});