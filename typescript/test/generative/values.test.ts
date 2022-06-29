import * as Parser from '../../src/parse';
import * as generators from './generators';
import {install} from 'jasmine-check';
install();


describe('Values', () => {
    const {gen, check} = (global || window as any);

    check.it('string values: ascii', gen.asciiString, (str) => {
        const input = constructString(str);
        const [offset, result, error] = Parser.stringValue(input, 0);
        expect(result).toEqual(str);
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('string values: unicode', gen.string, (str) => {
        const input = constructString(str);
        const [offset, result, error] = Parser.stringValue(input, 0);
        expect(result).toEqual(str);
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('string values: unicode escapes', gen.string, (str) => {
        const input = constructString(str);
        const [offset, result, error] = Parser.stringValue(input, 0);
        expect(result).toEqual(str);
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('string values: short escape sequences', generators.genStringEscapes, (str) => {
        const input = constructString(str);
        const [offset, result, error] = Parser.stringValue(input, 0);
        expect(result).toEqual(str);
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('number values: integer literals', generators.genInt, (input) => {
        const [offset, result, error] = Parser.numberValue(input, 0);
        expect(result).toEqual(parseInt(input.replace(/_/g, ''), 10));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('number values: hex literals', generators.genHex, (input) => {
        const [offset, result, error] = Parser.numberValue(input, 0);
        expect(result).toEqual(parseInt(input.replace(/_|0x/g, ''), 16));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('number values: floats', generators.genFloat, (input) => {
        const [offset, result, error] = Parser.numberValue(input, 0);
        expect(result).toEqual(parseFloat(input.replace(/_/g, '')));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('number values: scientific', generators.genScientific, (input) => {
        const [offset, result, error] = Parser.numberValue(input, 0);
        expect(result).toEqual(parseFloat(input.replace(/_/g, '')));
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('boolean values', generators.genBool, (input) => {
        const [offset, result, error] = Parser.booleanValue(input, 0);
        expect(result).toEqual(input === 'true');
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });

    check.it('null values', generators.genNull, (input) => {
        const [offset, result, error] = Parser.nullValue(input, 0);
        expect(result).toEqual(null);
        expect(offset).toEqual(input.length);
        expect(error).toBeUndefined();
    });
});


const constructString = (input) => {
    const escapeSequence = /["\n\t\f\r\b\\]|([\u{0080}-\u{FFFF}])/gu;
    
    return '"' + input.replace(escapeSequence, (match: string, codePoint: string) => {
        if (codePoint !== undefined) {
            return `\\u{${codePoint.codePointAt(0).toString(16)}}`;
        } else switch (match) {
            case '"': return '\\"';
            case '\n': return '\\n';
            case '\t': return '\\t';
            case '\f': return '\\f';
            case '\r': return '\\r';
            case '\b': return '\\b';
            case '\\': return '\\\\';
        }
    }) + '"';
}
