/**
 * A `ParseRule` is a function that takes an input string and a numeric cursor
 * offset and returns a `ParseResult` to indicate either a match, no match,
 * or an error. Rules can be composed into new rules with the `concat`,
 * `altern`, and `repeat` combinators.
 */
export type ParseRule = (input: string, offset: number) => ParseResult;

/**
 * A `ParseResult` is a vector containing the updated cursor offset, the value
 * matched by the parsing function, and an error string, if any.
 * 
 * If the parsing function successfully matches a substring of the input, the
 * cursor will be updated to be the index of the last matched character of the
 * input. The result will be whatever value was matched, and the error will be
 * `undefined`.
 * 
 * If the parsing function does not match, the offset will be unchanged, the
 * result will be undefined, and a description of any encountered error will
 * be returned in the final position.
 */
export type ParseResult = [offset: number, result: any, error: string | undefined];

/**
 * Constructs a parsing function that attempts to sequentially match each of
 * the supplied rules against the input string. If any of the rules do not
 * match, the compound fuction fails and returns the error message from the
 * first non-matching rule.
 * 
 * @param {ParseRule[]} rules a list of parsing rules
 * @returns a new ParseRule
 */
 export const concat = (...rules: ParseRule[]) => {
    return (input: string, offset: number): ParseResult => {
        let cursor = offset;
        const results = [];

        for (const rule of rules) {
            const [newOffset, match, error] = rule.call(null, input, cursor);

            if (error) {
                return [offset, undefined, error];
            } else {
                cursor = newOffset;
                if (Array.isArray(match)) {
                    results.push(...match);
                } else {
                    results.push(match);
                }
            }
        }
        return [cursor, results, undefined];
    }
}

/**
 * Constructs a parsing function that attempts to match any of the supplied
 * rules against the input string. The resulting function attempts to match
 * each of the supplied rules in order, stopping at the first matching rule.
 * If none of the input rules match, the compound function fails and returns
 * a comma-separated string of the error messages from each parse rule.
 * 
 * @param {ParseRule[]} rules a list of parsing rules
 * @returns a new ParseRule
 */
export const altern = (...rules: ParseRule[]) => {
    return (input: string, offset: number): ParseResult => {
        let cursor = offset;
        const errors = [];
        for (const rule of rules) {
            const [newOffset, result, error] = rule.call(null, input, cursor);

            if (!error) {
                return [newOffset, result, undefined];
            } else {
                cursor = newOffset;
                errors.push(...error);
            }
        }
        return [offset, undefined, `one of ${errors.join(',')}`];
    }
}

/**
 * Constructs a parsing function that attempts to match zero or more
 * repetitions of the concatenation of the supplied parsing rules. The
 * resulting function returns a flattened list of all matched items. If the
 * first parse rule does not match in any iteration, parsing stops and the
 * list of items matched so far is returned in the result position. If any
 * other parse rule encounteres unexpected input, the result is an error.
 * 
 * @param {ParseRule[]} rules a list of parsing rules
 * @returns a new ParseRule
 *
 * TODO: This should probably not error? Either generate a match or an empty list.
 */
export const repeat = (...rules: ParseRule[]) => {
    return (input: string, offset: number): ParseResult => {
        let cursor = offset;
        const results = [];
        let error = undefined;

        while (true) {
            const [first, ...rest] = rules;
            let result;
            [cursor, result, error] = first.call(null, input, cursor);

            if (error) {
                // No match
                error = undefined;
                break;
            } else {
                results.push(result);
            }

            [cursor, result, error] = concat(...rest)(input, cursor);

            if (error) {
                return [offset, undefined, error];
            } else {
                results.push(...result);
            }
        }

        return [cursor, results, error];
    }
}