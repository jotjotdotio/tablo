(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.repeat = exports.altern = exports.concat = void 0;
    /**
     * Constructs a parsing function that attempts to sequentially match each of
     * the supplied rules against the input string. If any of the rules do not
     * match, the compound fuction fails and returns the error message from the
     * first non-matching rule.
     *
     * @param {ParseRule[]} rules a list of parsing rules
     * @returns a new ParseRule
     */
    const concat = (...rules) => {
        return (input, offset) => {
            let cursor = offset;
            const results = [];
            for (const rule of rules) {
                const [newOffset, match, error] = rule.call(null, input, cursor);
                if (error) {
                    return [offset, undefined, error];
                }
                else {
                    cursor = newOffset;
                    if (Array.isArray(match)) {
                        results.push(...match);
                    }
                    else {
                        results.push(match);
                    }
                }
            }
            return [cursor, results, undefined];
        };
    };
    exports.concat = concat;
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
    const altern = (...rules) => {
        return (input, offset) => {
            let cursor = offset;
            const errors = [];
            for (const rule of rules) {
                const [newOffset, result, error] = rule.call(null, input, cursor);
                if (!error) {
                    return [newOffset, result, undefined];
                }
                else {
                    cursor = newOffset;
                    errors.push(...error);
                }
            }
            return [offset, undefined, `one of ${errors.join(',')}`];
        };
    };
    exports.altern = altern;
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
    const repeat = (...rules) => {
        return (input, offset) => {
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
                }
                else {
                    results.push(result);
                }
                [cursor, result, error] = (0, exports.concat)(...rest)(input, cursor);
                if (error) {
                    return [offset, undefined, error];
                }
                else {
                    results.push(...result);
                }
            }
            return [cursor, results, error];
        };
    };
    exports.repeat = repeat;
});
