import { ParseRule } from "../../src/combinators";

export const expectMatch = (pattern: RegExp, inputs: string[]) => {
    inputs.forEach(input => {
        pattern.lastIndex = 0;
        const result = pattern.exec(input);
        expect(result).not.toBeNull();
        expect(pattern.lastIndex).toBe(input.length);
    });
}

export const expectCapture = (rule: ParseRule, inputs: {[key: string]: any}) => {
    Object.keys(inputs).forEach(key => {
        const match = rule(key, 0);
        expect(match).not.toBeNull();

        const [offset, result, error] = match;
        expect(error).toBeUndefined();
        expect(offset).toBe(key.length);
        expect(result).toStrictEqual(inputs[key]);
    });
}

export const expectNoMatch = (rule: ParseRule, inputs: string[]) => {
    inputs.forEach(input => {
        const match = rule(input, 0);
        expect(match).not.toBeNull();

        const [offset, result, error] = match;

        if (offset === 0) {
            expect(result).toBeUndefined();
            expect(typeof error).toBe('string');
        } else {
            // A non-match
            expect(offset).not.toBe(input.length);
        }
    });
}

export const expectDocument = (rule: ParseRule, inputs: {[key: string]: any}) => {
    Object.keys(inputs).forEach(key => {
        const match = rule(key, 0);
        expect(match).not.toBeNull();

        const [offset, table, error] = match;
        expect(error).toBeUndefined();
        expect(offset).toBe(key.length);

        //const [head, data, _rules] = result;
        expect(table.header).toStrictEqual(inputs[key][0]);
        expect(table.data).toStrictEqual(inputs[key][1]);
    })
}
