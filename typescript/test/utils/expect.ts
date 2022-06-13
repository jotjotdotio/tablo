
export const expectMatch = (pattern: RegExp, inputs: string[]) => {
    inputs.forEach(input => {
        pattern.lastIndex = 0;
        const result = pattern.exec(input);
        expect(result).not.toBeNull();
        expect(pattern.lastIndex).toBe(input.length);
    });
}

export const expectCapture = (pattern, inputs: {[key: string]: any}) => {
    Object.keys(inputs).forEach(key => {
        const match = pattern(key, 0);
        expect(match).not.toBeNull();

        const [offset, result, error] = match;
        expect(error).toBeUndefined();
        expect(offset).toBe(key.length);
        expect(result).toBe(inputs[key]);
    });
}

export const expectNoMatch = (pattern, inputs: string[]) => {
    inputs.forEach(input => {
        const match = pattern(input, 0);
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