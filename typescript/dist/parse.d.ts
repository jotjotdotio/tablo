import { ParseResult } from './combinators';
export declare const Token: Readonly<{
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
export declare const document: (input: string, offset: number) => ParseResult;
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
export declare const header: (input: string, offset: number) => ParseResult;
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
export declare const data: (input: string, offset: number) => ParseResult;
export declare const format: (input: string, offset: number) => ParseResult;
export declare const _formatRules: (input: string, offset: number) => ParseResult;
export declare const _formatRule: (input: string, offset: number) => ParseResult;
export declare const cellRange: (input: string, offset: number) => ParseResult;
export declare const _properties: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a row of table data at the given offset of the
 * input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const row: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse an element value at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const element: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a column label at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const label: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse an equal sign at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const equals: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse an asterisk at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const star: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a tilde at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const tilde: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a comma at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const comma: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a newline character at the given offset of the
 * input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const newline: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse an opening brace at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const openBrace: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a closing brace at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const closeBrace: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a version identifier at the given offset of the
 * input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const version: (input: string, offset: number) => ParseResult;
/**
 * Attempts to parse a tag at the given offset of the input string.
 *
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export declare const tag: (input: string, offset: number) => ParseResult;
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
export declare const stringValue: (input: string, offset: number) => ParseResult;
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
export declare const numberValue: (input: string, offset: number) => ParseResult;
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
export declare const scientific: (input: string, offset: number) => ParseResult;
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
export declare const float: (input: string, offset: number) => ParseResult;
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
export declare const int: (input: string, offset: number) => ParseResult;
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
export declare const hex: (input: string, offset: number) => ParseResult;
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
export declare const booleanValue: (input: string, offset: number) => ParseResult;
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
export declare const nullValue: (input: string, offset: number) => ParseResult;
