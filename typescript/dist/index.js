System.register("combinators", [], function (exports_1, context_1) {
    "use strict";
    var concat, altern, repeat;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            /**
             * Constructs a parsing function that attempts to sequentially match each of
             * the supplied rules against the input string. If any of the rules do not
             * match, the compound fuction fails and returns the error message from the
             * first non-matching rule.
             *
             * @param {ParseRule[]} rules a list of parsing rules
             * @returns a new ParseRule
             */
            exports_1("concat", concat = (...rules) => {
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
            });
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
            exports_1("altern", altern = (...rules) => {
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
            });
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
            exports_1("repeat", repeat = (...rules) => {
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
                        [cursor, result, error] = concat(...rest)(input, cursor);
                        if (error) {
                            return [offset, undefined, error];
                        }
                        else {
                            results.push(...result);
                        }
                    }
                    return [cursor, results, error];
                };
            });
        }
    };
});
System.register("format", [], function (exports_2, context_2) {
    "use strict";
    var CellFormat;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            CellFormat = class CellFormat {
                constructor(rules) {
                    // Rules are stored as a mapping from [row,col,row,col] to property list,
                    // so we need to convert rules in [A], [A:B], [1], [1:2], and [A1] formats
                    // to [A1:B2] format. Infinity is used as a default max value if none is
                    // supplied in the rule.
                    const rule = /^([A-Z]+)(?::([A-Z]+))?$|^([0-9]+)(?::([0-9]+))?$|^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$/;
                    //const cell = /(?:([A-Z]+[\d]+):([A-Z]+[\d]+))|(?:([A-Z]+):([A-Z]+))|(?:([\d]+):([\d]+))|([A-Z]+[\d]+)[^\S\r\n]*/y;
                    this.rules = {};
                    for (let key in rules) {
                        const match = rule.exec(key);
                        if (!match) {
                            continue;
                        }
                        else {
                            let startRow = 0, endRow = Infinity, startCol = 0, endCol = Infinity;
                            if (match[1] !== undefined) {
                                // Column or column range
                                startCol = this.alphaToInt(match[1]);
                                endCol = (match[2] !== undefined) ? this.alphaToInt(match[2]) : startCol;
                            }
                            else if (match[3] !== undefined) {
                                // Row or row range
                                startRow = parseInt(match[3], 10);
                                endRow = (match[4] !== undefined) ? parseInt(match[4], 10) : startRow;
                            }
                            else if (match[5] !== undefined) {
                                // Cell or rectangular grid
                                startCol = this.alphaToInt(match[5]);
                                startRow = parseInt(match[6], 10);
                                endCol = (match[7] !== undefined) ? this.alphaToInt(match[7]) : startCol;
                                endRow = (match[8] !== undefined) ? parseInt(match[8], 10) : startRow;
                            }
                            if (startRow <= endRow && startCol <= endCol) {
                                this.rules[`${startRow},${startCol},${endRow},${endCol}`] = rules[key];
                            }
                        }
                    }
                }
                getProps(row, col) {
                    const numericColumn = this.alphaToInt(col);
                    return Object.keys(this.rules).filter((bounds) => {
                        const [startRow, startCol, endRow, endCol] = bounds.split(',').map((index) => parseFloat(index));
                        return (row >= startRow &&
                            row <= endRow &&
                            numericColumn >= startCol &&
                            numericColumn <= endCol);
                    }).reduce((result, key) => {
                        return result.concat(this.rules[key]);
                    }, []);
                }
                alphaToInt(index) {
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    return index.split('').reverse().reduce((sum, char, idx) => {
                        return sum + alphabet.indexOf(char) * (10 ^ idx);
                    }, 0);
                }
            };
            exports_2("CellFormat", CellFormat);
        }
    };
});
System.register("parse", ["combinators", "format"], function (exports_3, context_3) {
    "use strict";
    var combinators_1, format_1, pattern, Token, document, header, data, format, _formatRules, _formatRule, cellRange, _properties, row, element, label, equals, star, tilde, comma, newline, openBrace, closeBrace, version, tag, stringValue, numberValue, scientific, float, int, hex, booleanValue, nullValue;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (combinators_1_1) {
                combinators_1 = combinators_1_1;
            },
            function (format_1_1) {
                format_1 = format_1_1;
            }
        ],
        execute: function () {
            pattern = {
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
            exports_3("Token", Token = Object.freeze({
                Equals: Symbol(),
                Tilde: Symbol(),
                Star: Symbol(),
                Comma: Symbol(),
                Newline: Symbol(),
                OpenBrace: Symbol(),
                CloseBrace: Symbol(),
            }));
            /**
             * Attempts to parse a tablo document.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("document", document = (input, offset) => {
                let [position, result, error] = combinators_1.concat(header, data)(input, offset);
                if (error) {
                    return [position, undefined, error];
                }
                const [head, rows] = result;
                if (position === input.length) {
                    return [position, [head, rows, new format_1.CellFormat({})], undefined];
                }
                let fmts;
                [position, fmts, error] = format(input, position);
                if (error) {
                    return [position, undefined, error];
                }
                return [position, [head, rows, fmts], undefined];
            });
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
            exports_3("header", header = (input, offset) => {
                const headerLine = (input, offset) => {
                    let [position, elt, error] = label(input, offset);
                    if (error) {
                        return [position, [], undefined];
                    }
                    let matched;
                    [position, matched, error] = combinators_1.concat(combinators_1.repeat(comma, label), newline)(input, position);
                    if (error) {
                        return [position, undefined, error];
                    }
                    const labels = matched.filter((elt) => elt !== Token.Comma && elt !== Token.Newline);
                    labels.unshift(elt);
                    return [position, labels, undefined];
                };
                let [position, elts, error] = headerLine(input, offset);
                if (error) {
                    return [position, undefined, error];
                }
                let versionNum;
                [position, versionNum, error] = combinators_1.concat(equals, version, newline)(input, position);
                if (error) {
                    return [offset, undefined, error];
                }
                else if (versionNum[1] !== '0.1') {
                    return [offset, undefined, 'invalid version number'];
                }
                else {
                    return [position, elts, undefined];
                }
            });
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
            exports_3("data", data = (input, offset) => {
                const [position, rows, error] = combinators_1.repeat(row)(input, offset);
                if (error) {
                    return [position, undefined, error];
                }
                else {
                    const groups = rows.reduce((sections, elt) => {
                        if (elt === Token.Tilde) {
                            sections.push([]);
                        }
                        else {
                            sections[sections.length - 1].push(elt);
                        }
                        return sections;
                    }, [[]]);
                    return [position, groups, undefined];
                }
            });
            exports_3("format", format = (input, offset) => {
                let [position, _ignore, errors] = combinators_1.concat(star, newline)(input, offset);
                if (errors) {
                    return [position, undefined, errors];
                }
                return _formatRules(input, position);
            });
            exports_3("_formatRules", _formatRules = (input, offset) => {
                let [position, lines, error] = combinators_1.repeat(_formatRule)(input, offset);
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
            });
            exports_3("_formatRule", _formatRule = (input, offset) => {
                let [position, result, error] = combinators_1.concat(cellRange, _properties)(input, offset);
                if (error) {
                    return [position, undefined, error];
                }
                else {
                    const [range, props] = result;
                    return [position, { [range]: props }, undefined];
                }
            });
            exports_3("cellRange", cellRange = (input, offset) => {
                // TODO: Change to use pattern.cellRange
                pattern.cellRange.lastIndex = offset;
                let match = pattern.cellRange.exec(input);
                if (match) {
                    return [pattern.cellRange.lastIndex, match[1], undefined];
                }
                else {
                    return [offset, undefined, 'cell range'];
                }
            });
            exports_3("_properties", _properties = (input, offset) => {
                let [position, props, error] = combinators_1.concat(openBrace, combinators_1.concat(tag, combinators_1.repeat(comma, tag)), closeBrace)(input, offset);
                if (error) {
                    return [position, undefined, error];
                }
                else {
                    return [
                        position,
                        props.slice(1, -1).filter((prop) => prop !== Token.Comma),
                        undefined
                    ];
                }
            });
            /**
             * Attempts to parse a row of table data at the given offset of the
             * input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("row", row = (input, offset) => {
                let [position, rowData, error] = combinators_1.altern(combinators_1.concat(element, combinators_1.repeat(comma, element), newline), combinators_1.concat(tilde, newline))(input, offset);
                if (error) {
                    return [position, undefined, "element or '~'"];
                }
                else if (rowData[0] === Token.Tilde) {
                    return [position, Token.Tilde, undefined];
                }
                else {
                    return [position, rowData.filter((elt) => elt !== Token.Comma && elt !== Token.Newline), undefined];
                }
            });
            /**
             * Attempts to parse an element value at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("element", element = (input, offset) => {
                return combinators_1.altern(stringValue, numberValue, booleanValue, nullValue)(input, offset);
            });
            /**
             * Attempts to parse a column label at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("label", label = (input, offset) => {
                return combinators_1.altern(stringValue, nullValue)(input, offset);
            });
            /**
             * Attempts to parse an equal sign at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("equals", equals = (input, offset) => {
                pattern.equals.lastIndex = offset;
                const match = pattern.equals.exec(input);
                if (match) {
                    return [pattern.equals.lastIndex, Token.Equals, undefined];
                }
                else {
                    return [offset, undefined, 'header separator'];
                }
            });
            /**
             * Attempts to parse an asterisk at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("star", star = (input, offset) => {
                pattern.star.lastIndex = offset;
                const match = pattern.star.exec(input);
                if (match) {
                    return [pattern.star.lastIndex, Token.Star, undefined];
                }
                else {
                    return [offset, undefined, 'format separator'];
                }
            });
            /**
             * Attempts to parse a tilde at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("tilde", tilde = (input, offset) => {
                pattern.tilde.lastIndex = offset;
                const match = pattern.tilde.exec(input);
                if (match) {
                    return [pattern.tilde.lastIndex, Token.Tilde, undefined];
                }
                else {
                    return [offset, undefined, 'section separator'];
                }
            });
            /**
             * Attempts to parse a comma at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("comma", comma = (input, offset) => {
                pattern.comma.lastIndex = offset;
                const match = pattern.comma.exec(input);
                if (match) {
                    return [pattern.comma.lastIndex, Token.Comma, undefined];
                }
                else {
                    return [offset, undefined, 'comma'];
                }
            });
            /**
             * Attempts to parse a newline character at the given offset of the
             * input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("newline", newline = (input, offset) => {
                pattern.newline.lastIndex = offset;
                const match = pattern.newline.exec(input);
                if (match) {
                    return [pattern.newline.lastIndex, Token.Newline, undefined];
                }
                else {
                    return [offset, undefined, 'newline'];
                }
            });
            /**
             * Attempts to parse an opening brace at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("openBrace", openBrace = (input, offset) => {
                pattern.openBrace.lastIndex = offset;
                const match = pattern.openBrace.exec(input);
                if (match) {
                    return [pattern.openBrace.lastIndex, Token.OpenBrace, undefined];
                }
                else {
                    return [offset, undefined, '"{"'];
                }
            });
            /**
             * Attempts to parse a closing brace at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("closeBrace", closeBrace = (input, offset) => {
                pattern.closeBrace.lastIndex = offset;
                const match = pattern.closeBrace.exec(input);
                if (match) {
                    return [pattern.closeBrace.lastIndex, Token.CloseBrace, undefined];
                }
                else {
                    return [offset, undefined, '"}"'];
                }
            });
            /**
             * Attempts to parse a version identifier at the given offset of the
             * input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("version", version = (input, offset) => {
                pattern.version.lastIndex = offset;
                const match = pattern.version.exec(input);
                if (match) {
                    return [pattern.version.lastIndex, match[1], undefined];
                }
                else {
                    return [offset, undefined, 'version number'];
                }
            });
            /**
             * Attempts to parse a tag at the given offset of the input string.
             *
             * @param {string} input the string to be parsed
             * @param {number} offset the string index from which to begin parsing
             * @returns a ParseResult vector
             */
            exports_3("tag", tag = (input, offset) => {
                pattern.propName.lastIndex = offset;
                const match = pattern.propName.exec(input);
                if (match) {
                    return [pattern.propName.lastIndex, match[1], undefined];
                }
                else {
                    return [offset, undefined, 'Format Property'];
                }
            });
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
            exports_3("stringValue", stringValue = (input, offset) => {
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
            });
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
            exports_3("numberValue", numberValue = (input, offset) => {
                return combinators_1.altern(scientific, hex, float, int)(input, offset);
            });
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
            exports_3("scientific", scientific = (input, offset) => {
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
            });
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
            exports_3("float", float = (input, offset) => {
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
            });
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
            exports_3("int", int = (input, offset) => {
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
            });
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
            exports_3("hex", hex = (input, offset) => {
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
            });
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
            exports_3("booleanValue", booleanValue = (input, offset) => {
                pattern.boolean.lastIndex = offset;
                const match = pattern.boolean.exec(input);
                if (match) {
                    return [pattern.boolean.lastIndex, match[1] === 'true', undefined];
                }
                else {
                    return [offset, undefined, 'boolean'];
                }
            });
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
            exports_3("nullValue", nullValue = (input, offset) => {
                pattern.null.lastIndex = offset;
                const match = pattern.null.exec(input);
                if (match) {
                    return [pattern.null.lastIndex, null, undefined];
                }
                else {
                    return [offset, undefined, 'null'];
                }
            });
        }
    };
});
System.register("table", [], function (exports_4, context_4) {
    "use strict";
    var Table;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            Table = class Table {
                constructor(header, rows) {
                    this.header = header;
                    this.rows = rows;
                }
                concat(rows) {
                    this.rows.push(...rows);
                }
                getRow(row) {
                    return this.rows[row];
                }
                getCell(row, column) {
                    const columnNum = this.alphaToInt(column);
                    return this.rows[row][columnNum];
                }
                unparse() {
                    return this.header.toString() + '=\n' + this.rows.toString();
                }
                alphaToInt(index) {
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    return index.split('').reverse().reduce((sum, char, idx) => {
                        return sum + alphabet.indexOf(char) * (10 ^ idx);
                    }, 0);
                }
            };
            exports_4("Table", Table);
        }
    };
});
System.register("index", ["parse"], function (exports_5, context_5) {
    "use strict";
    var Parse, parse, unparse, doHeader, doData;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (Parse_1) {
                Parse = Parse_1;
            }
        ],
        execute: function () {
            exports_5("parse", parse = (input) => {
                const [_ignore, data, error] = Parse.document(input, 0);
                if (error) {
                    throw error;
                }
                else {
                    return data;
                }
            });
            exports_5("unparse", unparse = (header, data) => {
                const hh = doHeader(header);
                const dd = doData(data);
                return `${hh}\n=\n${dd}\n`;
            });
            doHeader = (header) => {
                return '';
            };
            doData = (data) => {
                return "";
            };
        }
    };
});
