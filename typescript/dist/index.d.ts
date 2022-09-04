declare module "combinators" {
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
    export const concat: (...rules: ParseRule[]) => (input: string, offset: number) => ParseResult;
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
    export const altern: (...rules: ParseRule[]) => (input: string, offset: number) => ParseResult;
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
    export const repeat: (...rules: ParseRule[]) => (input: string, offset: number) => ParseResult;
}
declare module "format" {
    export class CellFormat {
        private rules;
        constructor(rules: {
            [key: string]: string[];
        });
        getProps(row: number, col: string): string[];
        private alphaToInt;
    }
}
declare module "parse" {
    import { ParseResult } from "combinators";
    export const Token: Readonly<{
        Equals: symbol;
        Tilde: symbol;
        Star: symbol;
        Comma: symbol;
        Newline: symbol;
        OpenBrace: symbol;
        CloseBrace: symbol;
    }>;
    /**
     * Attempts to parse a tablo document.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const document: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a header line at the given offset of the input string.
     *
     * A header is an optional single line followed by a required line containing
     * a single equal sign and a version string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const header: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a data section starting at the given offset of the
     * input string.
     *
     * Data is a sequence of zero or more lines, where each line is a comma-
     * separated series of elements of either string, number, boolean, or null
     * type. A tilde on a single row indicates a break between a series of rows.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const data: (input: string, offset: number) => ParseResult;
    export const format: (input: string, offset: number) => ParseResult;
    export const _formatRules: (input: string, offset: number) => ParseResult;
    export const _formatRule: (input: string, offset: number) => ParseResult;
    export const cellRange: (input: string, offset: number) => ParseResult;
    export const _properties: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a row of table data at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const row: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse an element value at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const element: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a column label at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const label: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse an equal sign at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const equals: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse an asterisk at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const star: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a tilde at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const tilde: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a comma at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const comma: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a newline character at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const newline: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse an opening brace at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const openBrace: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a closing brace at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const closeBrace: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a version identifier at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const version: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a tag at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    export const tag: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a string literal at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     *
     * If successful, the offset will be the location of the last character of the
     * string literal, the result will be the matched string with escape sequences
     * converted, and error will be undefined. If an error is encountered, offset
     * will be the initial start position, result will be undefined, and error
     * will be 'string'.
     */
    export const stringValue: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a number literal at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * number literal, the result will be the matched number, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "one of scientific,
     * hexadecimal, float, integer".
     */
    export const numberValue: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a number in scientific notation at the given offset of
     * the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * number literal, the result will be the matched number, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "scientific".
     */
    export const scientific: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a floating point value at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * number literal, the result will be the matched number, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "float".
     */
    export const float: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse an integer value at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * number literal, the result will be the matched number, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "integer".
     */
    export const int: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a hexadecimal value at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * number literal, the result will be the matched number, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "hexadecimal".
     */
    export const hex: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a boolean value at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * boolean literal, the result will be the matched value, and error will be
     * undefined. If an error is encountered, offset will be the initial start
     * position, result will be undefined, and error will be "boolean".
     */
    export const booleanValue: (input: string, offset: number) => ParseResult;
    /**
     * Attempts to parse a null value at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns an [offset, result, error] vector
     *
     * If successful, the offset will be the location of the last character of the
     * null value, the result will be null, and error will be undefined. If an
     * error is encountered, offset will be the initial start position, result
     * will be undefined, and error will be "null".
     */
    export const nullValue: (input: string, offset: number) => ParseResult;
}
declare module "table" {
    export type label = string | null;
    export type element = string | number | boolean | null;
    export type row = element[];
    export class Table {
        header: label[];
        rows: row[];
        constructor(header: label[], rows: row[]);
        concat(rows: row[]): void;
        getRow(row: number): row;
        getCell(row: number, column: string): element;
        unparse(): string;
        private alphaToInt;
    }
}
declare module "index" {
    import { label, row } from "table";
    export const parse: (input: string) => any;
    export const unparse: (header: label[], data: row[]) => string;
}
