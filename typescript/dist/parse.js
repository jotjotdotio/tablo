(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./combinators", "./format"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullValue = exports.booleanValue = exports.hex = exports.int = exports.float = exports.scientific = exports.numberValue = exports.stringValue = exports.tag = exports.version = exports.closeBrace = exports.openBrace = exports.newline = exports.comma = exports.tilde = exports.star = exports.equals = exports.label = exports.element = exports.row = exports._properties = exports.cellRange = exports._formatRule = exports._formatRules = exports.format = exports.data = exports.header = exports.document = exports.Token = void 0;
    const combinators_1 = require("./combinators");
    const format_1 = require("./format");
    const pattern = {
        // Value types
        string: /"((?:[^"\n\r\b\\]|\\.)*)"[^\S\r\n]*/y,
        integer: /([+-]?(?:\d+_?)*\d+)[^\S\r\n]*/y,
        float: /([+-]?(?:(?:(?:0|[1-9](?:_?\d+)*)\.(?:(?:\d+_?)*\d+)?)|0\.|\.\d+))[^\S\r\n]*/y,
        hex: /([+-]?0x(?:[\dA-Fa-f]+_?)*[\dA-Fa-f]+)[^\S\r\n]*/y,
        exponent: /([+-]?(?:(?:(?:0|[1-9](?:_?\d+)*)\.(?:(?:\d+_?)*\d+)?)|0\.|\.\d+|(?:\d+_?)*\d+))[eE]([+-]?(?:\d+_?)*\d+)[^\S\r\n]*/y,
        date: /#(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?/y,
        time: /(\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{4}))?)?)?(Z|[+-]?\d{4})?/y,
        boolean: /(true|false)[^\S\r\n]*/y,
        null: /-[^\S\r\n]*/y,
        // Syntactic tokens
        newline: /\n/y,
        comma: /,[^\S\r\n]*/y,
        equals: /=/y,
        tilde: /~/y,
        star: /\*/y,
        openBrace: /{[^\S\r\n]*/y,
        closeBrace: /}[^\S\r\n]*\n/y,
        version: / ?(\d+\.\d+)/y,
        // Matches cell specifiers in the form A1:Z9, B:F, 0:9, or D4
        cellRange: /((?:[A-Z]+[\d]+:[A-Z]+[\d]+)|(?:[A-Z]+:[A-Z]+)|(?:[\d]+:[\d]+)|(?:[A-Z]+[\d]+))[^\S\r\n]*/y,
        tag: /([A-Za-z_][A-Za-z0-9_-]*)[^\S\r\n]*/y,
        propName: /(plain|bold|italic|underline|strike|normal|mono|black|red|orange|yellow|green|blue|violet|grey|white)[^\S\r\n]*/y,
    };
    exports.Token = Object.freeze({
        Equals: Symbol(),
        Tilde: Symbol(),
        Star: Symbol(),
        Comma: Symbol(),
        Newline: Symbol(),
        OpenBrace: Symbol(),
        CloseBrace: Symbol(),
    });
    /**
     * Attempts to parse a tablo document.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const document = (input, offset) => {
        let [position, result, error] = (0, combinators_1.concat)(exports.header, exports.data)(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        const [head, rows] = result;
        if (position === input.length) {
            return [position, [head, rows, new format_1.CellFormat({})], undefined];
        }
        let fmts;
        [position, fmts, error] = (0, exports.format)(input, position);
        if (error) {
            return [position, undefined, error];
        }
        return [position, [head, rows, fmts], undefined];
    };
    exports.document = document;
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
    const header = (input, offset) => {
        const headerLine = (input, offset) => {
            let [position, elt, error] = (0, exports.label)(input, offset);
            if (error) {
                return [position, [], undefined];
            }
            let matched;
            [position, matched, error] = (0, combinators_1.concat)((0, combinators_1.repeat)(exports.comma, exports.label), exports.newline)(input, position);
            if (error) {
                return [position, undefined, error];
            }
            const labels = matched.filter((elt) => elt !== exports.Token.Comma && elt !== exports.Token.Newline);
            labels.unshift(elt);
            return [position, labels, undefined];
        };
        let [position, elts, error] = headerLine(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        let versionNum;
        [position, versionNum, error] = (0, combinators_1.concat)(exports.equals, exports.version, exports.newline)(input, position);
        if (error) {
            return [offset, undefined, error];
        }
        else if (versionNum[1] !== '0.1') {
            return [offset, undefined, 'invalid version number'];
        }
        else {
            return [position, elts, undefined];
        }
    };
    exports.header = header;
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
    const data = (input, offset) => {
        const [position, rows, error] = (0, combinators_1.repeat)(exports.row)(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        else {
            const groups = rows.reduce((sections, elt) => {
                if (elt === exports.Token.Tilde) {
                    sections.push([]);
                }
                else {
                    sections[sections.length - 1].push(elt);
                }
                return sections;
            }, [[]]);
            return [position, groups, undefined];
        }
    };
    exports.data = data;
    const format = (input, offset) => {
        let [position, _ignore, errors] = (0, combinators_1.concat)(exports.star, exports.newline)(input, offset);
        if (errors) {
            return [position, undefined, errors];
        }
        return (0, exports._formatRules)(input, position);
    };
    exports.format = format;
    const _formatRules = (input, offset) => {
        let [position, lines, error] = (0, combinators_1.repeat)(exports._formatRule)(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        else if (position !== input.length) {
            return [position, undefined, 'format rule'];
        }
        const rules = lines.reduce((result, line) => {
            Object.assign(result, line);
            return result;
        }, {});
        return [position, new format_1.CellFormat(rules), undefined];
    };
    exports._formatRules = _formatRules;
    const _formatRule = (input, offset) => {
        let [position, result, error] = (0, combinators_1.concat)(exports.cellRange, exports._properties)(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        else {
            const [range, props] = result;
            return [position, { [range]: props }, undefined];
        }
    };
    exports._formatRule = _formatRule;
    const cellRange = (input, offset) => {
        // TODO: Change to use pattern.cellRange
        pattern.cellRange.lastIndex = offset;
        let match = pattern.cellRange.exec(input);
        if (match) {
            return [pattern.cellRange.lastIndex, match[1], undefined];
        }
        else {
            return [offset, undefined, 'cell range'];
        }
    };
    exports.cellRange = cellRange;
    const _properties = (input, offset) => {
        let [position, props, error] = (0, combinators_1.concat)(exports.openBrace, (0, combinators_1.concat)(exports.tag, (0, combinators_1.repeat)(exports.comma, exports.tag)), exports.closeBrace)(input, offset);
        if (error) {
            return [position, undefined, error];
        }
        else {
            return [
                position,
                props.slice(1, -1).filter((prop) => prop !== exports.Token.Comma),
                undefined
            ];
        }
    };
    exports._properties = _properties;
    /**
     * Attempts to parse a row of table data at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const row = (input, offset) => {
        let [position, rowData, error] = (0, combinators_1.altern)((0, combinators_1.concat)(exports.element, (0, combinators_1.repeat)(exports.comma, exports.element), exports.newline), (0, combinators_1.concat)(exports.tilde, exports.newline))(input, offset);
        if (error) {
            return [position, undefined, "element or '~'"];
        }
        else if (rowData[0] === exports.Token.Tilde) {
            return [position, exports.Token.Tilde, undefined];
        }
        else {
            return [position, rowData.filter((elt) => elt !== exports.Token.Comma && elt !== exports.Token.Newline), undefined];
        }
    };
    exports.row = row;
    /**
     * Attempts to parse an element value at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const element = (input, offset) => {
        return (0, combinators_1.altern)(exports.stringValue, exports.numberValue, exports.booleanValue, exports.nullValue)(input, offset);
    };
    exports.element = element;
    /**
     * Attempts to parse a column label at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const label = (input, offset) => {
        return (0, combinators_1.altern)(exports.stringValue, exports.nullValue)(input, offset);
    };
    exports.label = label;
    /**
     * Attempts to parse an equal sign at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const equals = (input, offset) => {
        pattern.equals.lastIndex = offset;
        const match = pattern.equals.exec(input);
        if (match) {
            return [pattern.equals.lastIndex, exports.Token.Equals, undefined];
        }
        else {
            return [offset, undefined, 'header separator'];
        }
    };
    exports.equals = equals;
    /**
     * Attempts to parse an asterisk at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const star = (input, offset) => {
        pattern.star.lastIndex = offset;
        const match = pattern.star.exec(input);
        if (match) {
            return [pattern.star.lastIndex, exports.Token.Star, undefined];
        }
        else {
            return [offset, undefined, 'format separator'];
        }
    };
    exports.star = star;
    /**
     * Attempts to parse a tilde at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const tilde = (input, offset) => {
        pattern.tilde.lastIndex = offset;
        const match = pattern.tilde.exec(input);
        if (match) {
            return [pattern.tilde.lastIndex, exports.Token.Tilde, undefined];
        }
        else {
            return [offset, undefined, 'section separator'];
        }
    };
    exports.tilde = tilde;
    /**
     * Attempts to parse a comma at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const comma = (input, offset) => {
        pattern.comma.lastIndex = offset;
        const match = pattern.comma.exec(input);
        if (match) {
            return [pattern.comma.lastIndex, exports.Token.Comma, undefined];
        }
        else {
            return [offset, undefined, 'comma'];
        }
    };
    exports.comma = comma;
    /**
     * Attempts to parse a newline character at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const newline = (input, offset) => {
        pattern.newline.lastIndex = offset;
        const match = pattern.newline.exec(input);
        if (match) {
            return [pattern.newline.lastIndex, exports.Token.Newline, undefined];
        }
        else {
            return [offset, undefined, 'newline'];
        }
    };
    exports.newline = newline;
    /**
     * Attempts to parse an opening brace at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const openBrace = (input, offset) => {
        pattern.openBrace.lastIndex = offset;
        const match = pattern.openBrace.exec(input);
        if (match) {
            return [pattern.openBrace.lastIndex, exports.Token.OpenBrace, undefined];
        }
        else {
            return [offset, undefined, '"{"'];
        }
    };
    exports.openBrace = openBrace;
    /**
     * Attempts to parse a closing brace at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const closeBrace = (input, offset) => {
        pattern.closeBrace.lastIndex = offset;
        const match = pattern.closeBrace.exec(input);
        if (match) {
            return [pattern.closeBrace.lastIndex, exports.Token.CloseBrace, undefined];
        }
        else {
            return [offset, undefined, '"}"'];
        }
    };
    exports.closeBrace = closeBrace;
    /**
     * Attempts to parse a version identifier at the given offset of the
     * input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const version = (input, offset) => {
        pattern.version.lastIndex = offset;
        const match = pattern.version.exec(input);
        if (match) {
            return [pattern.version.lastIndex, match[1], undefined];
        }
        else {
            return [offset, undefined, 'version number'];
        }
    };
    exports.version = version;
    /**
     * Attempts to parse a tag at the given offset of the input string.
     *
     * @param {string} input the string to be parsed
     * @param {number} offset the string index from which to begin parsing
     * @returns a ParseResult vector
     */
    const tag = (input, offset) => {
        pattern.propName.lastIndex = offset;
        const match = pattern.propName.exec(input);
        if (match) {
            return [pattern.propName.lastIndex, match[1], undefined];
        }
        else {
            return [offset, undefined, 'Format Property'];
        }
    };
    exports.tag = tag;
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
    const stringValue = (input, offset) => {
        const escapeSequence = /\\["ntfrb\\]|\\u\{([0-9A-Fa-f]{1,8})\}/g;
        pattern.string.lastIndex = offset;
        const match = pattern.string.exec(input);
        if (match) {
            const value = match[1].replace(escapeSequence, (match, codePoint) => {
                if (codePoint !== undefined) {
                    return String.fromCodePoint(parseInt(codePoint, 16));
                }
                else
                    switch (match) {
                        case '\\"': return '"';
                        case '\\n': return '\n';
                        case '\\t': return '\t';
                        case '\\f': return '\f';
                        case '\\r': return '\r';
                        case '\\b': return '\b';
                        case '\\\\': return '\\';
                    }
            });
            return [pattern.string.lastIndex, value, undefined];
        }
        else {
            return [offset, undefined, 'string'];
        }
    };
    exports.stringValue = stringValue;
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
    const numberValue = (input, offset) => {
        return (0, combinators_1.altern)(exports.scientific, exports.hex, exports.float, exports.int)(input, offset);
    };
    exports.numberValue = numberValue;
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
    const scientific = (input, offset) => {
        pattern.exponent.lastIndex = offset;
        const match = pattern.exponent.exec(input);
        if (match) {
            const mantissa = match[1].replace(/_/g, '');
            const exponent = match[2].replace(/_/g, '');
            return [
                pattern.exponent.lastIndex,
                parseFloat(`${mantissa}e${exponent}`),
                undefined
            ];
        }
        else {
            return [offset, undefined, 'scientific'];
        }
    };
    exports.scientific = scientific;
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
    const float = (input, offset) => {
        pattern.float.lastIndex = offset;
        const match = pattern.float.exec(input);
        if (match) {
            return [
                pattern.float.lastIndex,
                parseFloat(match[1].replace(/_/g, '')),
                undefined
            ];
        }
        else {
            return [offset, undefined, 'float'];
        }
    };
    exports.float = float;
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
    const int = (input, offset) => {
        pattern.integer.lastIndex = offset;
        const match = pattern.integer.exec(input);
        if (match) {
            return [
                pattern.integer.lastIndex,
                parseInt(match[1].replace(/_/g, ''), 10),
                undefined
            ];
        }
        else {
            return [offset, undefined, 'integer'];
        }
    };
    exports.int = int;
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
    const hex = (input, offset) => {
        pattern.hex.lastIndex = offset;
        const match = pattern.hex.exec(input);
        if (match) {
            return [
                pattern.hex.lastIndex,
                parseInt(match[1].replace('0x', '').replace(/_/g, ''), 16),
                undefined
            ];
        }
        else {
            return [offset, undefined, 'hexadecimal'];
        }
    };
    exports.hex = hex;
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
    const booleanValue = (input, offset) => {
        pattern.boolean.lastIndex = offset;
        const match = pattern.boolean.exec(input);
        if (match) {
            return [pattern.boolean.lastIndex, match[1] === 'true', undefined];
        }
        else {
            return [offset, undefined, 'boolean'];
        }
    };
    exports.booleanValue = booleanValue;
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
    const nullValue = (input, offset) => {
        pattern.null.lastIndex = offset;
        const match = pattern.null.exec(input);
        if (match) {
            return [pattern.null.lastIndex, null, undefined];
        }
        else {
            return [offset, undefined, 'null'];
        }
    };
    exports.nullValue = nullValue;
});
