export type parseResult = [offset: number, result: any, error: string | undefined];
export type rule = (input: string, offset: number) => parseResult;

/**
 * Parses the input string starting at the given offset, attempting to match
 * the concatenation of the list of parsing rules.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index of the extent of completed parsing
 * @param {rule[]} rules a list of parsing rules
 * @returns an [offset, result, error] vector
 * 
 * If successful, the offset will be updated to the end of the matched string,
 * the result will be the concatenation of parse function results, and error
 * will be undefined. If any of the parsing rules fail to match, offset will
 * be the initial value, the result will be undefined, and error will be the
 * error message from the failing parsing rule.
 */
 export const concat = (input: string, offset: number, rules: rule[]): parseResult => {
    const seq = [];
    for (const rule of rules) {
        const [newOffset, result, error] = rule.call(null, input, offset);
        if (error) {
            return [offset, undefined, error];
        } else {
            offset = newOffset;
            seq.push(result);
        }
    }
    return [offset, seq, undefined];
}

/**
 * Parses the input string starting at the given offset, testing each parsing
 * rule in order and returning the first available match.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index of the extent of completed parsing
 * @param {rule[]} rules a list of parsing rules
 * @returns an [offset, result, error] vector
 *
 * If successful, the offset will be updated to the end of the matched string,
 * the result will be the result of the first matching parse function, and 
 * error will be undefined. If any of the parsing rules fail to match, offset
 * will be the initial value, the result will be undefined, and error will be
 * the concatenation of error messages from the failing parsing rules.
 */
 export const altern = (input: string, offset: number, rules: rule[]): parseResult => {
    const errors = [];
    for (const rule of rules) {
        const [newOffset, result, error] = rule.call(null, input, offset);

        if (!error) {
            return [newOffset, result, undefined];
        } else {
            errors.push(...error);
        }
    }
    return [offset, undefined, `one of ${errors.join(',')}`];
}

/**
 * Parses the input string starting at the given offset, consuming zero or
 * more repetitions of the concatenation of the parsing rules.
 *  
 * @param {string} input the string to be parsed
 * @param {number} offset the string index of the extent of completed parsing
 * @param {rule[]} rules a list of parsing rules
 * @returns an [offset, result, error] vector
 *
 * If successful, the offset will be updated to the end of the matched string,
 * the result will be the flattened list of matched values, and error will be
 * undefined. If an error is encountered...
 * TODO: This should probably not error. Either generate a match or an empty list.
 */
 export const repeat = (input: string, offset: number, rules: rule[]): parseResult => {
    let position = offset;
    const results = [];
    let error = undefined;

    while (true) {
        const [first, ...rest] = rules;
        let result;
        [position, result, error] = first.call(null, input, position);

        if (error) {
            // No match
            error = undefined;
            break;
        } else {
            results.push(result);
        }

        [position, result, error] = concat(input, position, rest);

        if (error) {
            return [offset, undefined, error];
        } else {
            results.push(...result);
        }
    }

    return [position, results, error];
}