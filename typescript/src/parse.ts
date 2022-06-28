import {concat, altern, repeat, ParseResult} from './combinators';

const pattern = {
    // Value types
    string: /"((?:[^"\\]|\\.)*)"[^\S\r\n]*/y,
    integer: /([+-]?(?:\d+_?)*\d+)[^\S\r\n]*/y,
    float: /([+-]?(?:(?:(?:0|[1-9](?:_?\d+)*)\.(?:(?:\d+_?)*\d+)?)|0\.|\.0+))[^\S\r\n]*/y,
    hex: /([+-]?0x(?:[\dA-Fa-f]+_?)*[\dA-Fa-f]+)[^\S\r\n]*/y,
    exponent: /([+-]?(?:(?:(?:0|[1-9](?:_?\d+)*)\.(?:(?:\d+_?)*\d+)?)|0\.|\.0+|(?:\d+_?)*\d+))[eE]([+-]?(?:\d+_?)*\d+)[^\S\r\n]*/y,
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
    formatRngSel: /\[([A-Z]+(?::[A-Z]+)?|[\d]+(?::[\d]+)?|[A-Z]+[\d]+(?::[A-Z]+[\d]+)?)\][^\S\r\n]*/y,
    // Matches cell specifiers in the form A1:Z9, B:F, 0:9, or D4
    cellRange: /(?:([A-Z]+[\d]+):([A-Z]+[\d]+)|([A-Z]+):([A-Z]+)|([\d]+):([\d]+)|([A-Z]+[\d]+))[^\S\r\n]*/y,
    tag: /([A-Za-z][A-Za-z0-9_-]*)[^\S\r\n]*/y,
    propName: /(plain|bold|italic|underline|strike|normal|mono|black|red|orange|yellow|green|blue|violet|grey|white)[^\S\r\n]*/y,
};

type label = string | null;
type header = label[];

type element = string | number | boolean | null;
type row = element[];
type data = row[];

type format = { [key: string]: string[] };

export const Token = Object.freeze({
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
 export const document = (input: string, offset: number): ParseResult => {
    let [position, result, error] = concat(header, data)(input, offset);

    if (error) {
        return [position, undefined, error];
    }

    const [head, rows] = result;

    if (position === input.length) {
        return [position, [head, rows, new CellFormat({})], undefined];
    }

    let fmts;
    [position, fmts, error] = format(input, position);

    if (error) {
        return [position, undefined, error];
    }

    return [position, [head, rows, fmts], undefined];
}

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
 export const header = (input: string, offset: number): ParseResult => {
    const headerLine = (input: string, offset: number): ParseResult => {
        let [position, elt, error] = label(input, offset);

        if (error) { return [position, [], undefined]; }

        let matched;
        [position, matched, error] = concat(repeat(comma, label), newline)(input, position);

        if (error) { return [position, undefined, error]; }

        const labels = matched[0].filter((elt) => elt !== Token.Comma);
        labels.unshift(elt);
        return [position, labels, undefined];
    }

    let [position, elts, error] = headerLine(input, offset);

    if (error) {
        return [position, undefined, error];
    }

    let versionNum;
    [position, versionNum, error] = concat(equals, version, newline)(input, position);

    if (error) {
        return [position, undefined, error];
    } else if (versionNum[1] !== '0.1') {
        return [offset, undefined, 'invalid version number'];
    } else {
        return [position, elts, undefined];
    }
}

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
 export const data = (input: string, offset: number): ParseResult => {
    const [position, rows, error] = repeat(row)(input, offset);

    if (error) {
        return [position, undefined, error];
    } else {
        const groups = rows.reduce((sections, elt) => {
            if (elt === Token.Tilde) {
                sections.push([]);
            } else {
                sections[sections.length - 1].push(elt);
            }

            return sections;
        }, [[]]);

        return [position, groups, undefined];
    }
}

export const format = (input: string, offset: number): ParseResult => {
    let [position, _ignore, errors] = concat(star, newline)(input, offset);

    if (errors) {
        return [position, undefined, errors];
    }

    return _formatRules(input, position);
}

export const _formatRules = (input: string, offset: number): ParseResult => {
    type RuleType = { [key: string]: string[] };
    let [position, lines, error] = repeat(_formatRule)(input, offset);

    if (error) {
        return [position, undefined, error];
    } else if (position !== input.length) {
        return [position, undefined, 'format rule'];
    }

    const rules = lines.reduce((result: RuleType, line: RuleType) => {
        Object.assign(result, line);
        return result;
    }, {});

    return [position, new CellFormat(rules), undefined];
}

export const _formatRule = (input: string, offset: number): ParseResult => {
    let [position, result, error] = concat(_cellRange, _properties)(input, offset);

    if (error) {
        return [position, undefined, error];
    } else {
        const [range, props] = result;
        return [position, { [range]: props }, undefined];
    }
}

export const _cellRange = (input: string, offset: number): ParseResult => {
    // TODO: Change to use pattern.cellRange
    pattern.formatRngSel.lastIndex = offset;
    let match = pattern.formatRngSel.exec(input);

    if (match) {
        return [pattern.formatRngSel.lastIndex, match[1], undefined];
    } else {
        return [offset, undefined, 'Range Selector'];
    }
}

export const _properties = (input: string, offset: number): ParseResult => {
    let [position, props, error] = concat(
        openBrace,
        concat(tag, repeat(comma, tag)),
        closeBrace
    )(input, offset);

    if (error) {
        return [position, undefined, error];
    } else {
        return [
            position,
            props.slice(1, -1).filter((prop: string | Symbol) => prop !== Token.Comma),
            undefined
        ];
    }
};

/**
 * Attempts to parse a row of table data at the given offset of the
 * input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const row = (input: string, offset: number): ParseResult => {
    let [position, rowData, error] = altern(
        concat(element, repeat(comma, element)),
        concat(tilde, newline)
    )(input, offset);

    if (error) {
        return [position, undefined, "element or '~'"];
    } else if (rowData![0] === Token.Tilde) {
        return [position, Token.Tilde, undefined];
    } else {
        return [position, rowData.filter((elt: any) => elt !== Token.Comma), undefined];
    }
};

/**
 * Attempts to parse an element value at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const element = (input: string, offset: number): ParseResult => {
    return altern(stringValue, numberValue, booleanValue, nullValue)(input, offset);
}

/**
 * Attempts to parse a column label at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const label = (input: string, offset: number): ParseResult => {
    return altern(stringValue, nullValue)(input, offset);
}

/**
 * Attempts to parse an equal sign at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const equals = (input: string, offset: number): ParseResult => {
    pattern.equals.lastIndex = offset;
    const match = pattern.equals.exec(input);

    if (match) {
        return [pattern.equals.lastIndex, Token.Equals, undefined];
    } else {
        return [offset, undefined, 'header separator'];
    }
}

/**
 * Attempts to parse an asterisk at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const star = (input: string, offset: number): ParseResult => {
    pattern.star.lastIndex = offset;
    const match = pattern.star.exec(input);
    if (match) {
        return [pattern.star.lastIndex, Token.Star, undefined];
    } else {
        return [offset, undefined, 'format separator'];
    }
}

/**
 * Attempts to parse a tilde at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export const tilde = (input: string, offset: number): ParseResult => {
    pattern.tilde.lastIndex = offset;
    const match = pattern.tilde.exec(input);
    if (match) {
        return [pattern.tilde.lastIndex, Token.Tilde, undefined];
    } else {
        return [offset, undefined, 'section separator'];
    }
}

/**
 * Attempts to parse a comma at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export const comma = (input: string, offset: number): ParseResult => {
    pattern.comma.lastIndex = offset;
    const match = pattern.comma.exec(input);
    if (match) {
        return [pattern.comma.lastIndex, Token.Comma, undefined];
    } else {
        return [offset, undefined, 'comma'];
    }
}

/**
 * Attempts to parse a newline character at the given offset of the
 * input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const newline = (input: string, offset: number): ParseResult => {
    pattern.newline.lastIndex = offset;
    const match = pattern.newline.exec(input);
    if (match) {
        return [pattern.newline.lastIndex, Token.Newline, undefined];
    } else {
        return [offset, undefined, 'newline'];
    }
}

/**
 * Attempts to parse an opening brace at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const openBrace = (input: string, offset: number): ParseResult => {
    pattern.openBrace.lastIndex = offset;
    const match = pattern.openBrace.exec(input);

    if (match) {
        return [pattern.openBrace.lastIndex, Token.OpenBrace, undefined];
    } else {
        return [offset, undefined, '"{"'];
    }
}

/**
 * Attempts to parse a closing brace at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
export const closeBrace = (input: string, offset: number): ParseResult => {
    pattern.closeBrace.lastIndex = offset;
    const match = pattern.closeBrace.exec(input);

    if (match) {
        return [pattern.closeBrace.lastIndex, Token.CloseBrace, undefined];
    } else {
        return [offset, undefined, '"}"'];
    }
}

/**
 * Attempts to parse a version identifier at the given offset of the
 * input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const version = (input: string, offset: number): ParseResult => {
    pattern.version.lastIndex = offset;
    const match = pattern.version.exec(input);

    if (match) {
        return [pattern.version.lastIndex, match[1], undefined];
    } else {
        return [offset, undefined, 'version number'];
    }
}

/**
 * Attempts to parse a tag at the given offset of the input string.
 * 
 * @param {string} input the string to be parsed
 * @param {number} offset the string index from which to begin parsing
 * @returns a ParseResult vector
 */
 export const tag = (input: string, offset: number): ParseResult => {
    pattern.propName.lastIndex = offset;
    const match = pattern.propName.exec(input);

    if (match) {
        return [pattern.propName.lastIndex, match[1], undefined];
    } else {
        return [offset, undefined, 'Format Property'];
    }
}

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
export const stringValue = (input: string, offset: number): ParseResult => {
    const escapeSequence = /\\["nt\\]|\\u\{([0-9A-Fa-f]{1,8})\}/g;
    
    pattern.string.lastIndex = offset;
    const match = pattern.string.exec(input);

    if (match) {
        const value = match[1].replace(escapeSequence, (match: string, codePoint: string) => {
            if (codePoint !== undefined) {
                return String.fromCodePoint(parseInt(codePoint, 16));
            } else switch (match) {
                case '\\"': return '"';
                case '\\n': return '\n';
                case '\\t': return '\t';
                case '\\\\': return '\\';
            }
        });

        return [pattern.string.lastIndex, value, undefined];
    } else {
        return [offset, undefined, 'string'];
    }
}

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
export const numberValue = (input: string, offset: number): ParseResult => {
    return altern(scientific, hex, float, int)(input, offset);
}

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
export const scientific = (input: string, offset: number): ParseResult => {
    pattern.exponent.lastIndex = offset;
    const match = pattern.exponent.exec(input);

    if (match) {
        const mantissa = match[1].replace(/_/g, '');
        const exponent = match[2].replace(/_/g, '');

        return [
            pattern.exponent.lastIndex,
            parseFloat(`${mantissa}e${exponent}`),
            undefined];
    } else {
        return [offset, undefined, 'scientific'];
    }
}

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

export const float = (input: string, offset: number): ParseResult => {
    pattern.float.lastIndex = offset;
    const match = pattern.float.exec(input);

    if (match) {
        return [
            pattern.float.lastIndex,
            parseFloat(match[1].replace(/_/g, '')),
            undefined
        ];
    } else {
        return [offset, undefined, 'float'];
    }
}

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
export const int = (input: string, offset: number): ParseResult => {
    pattern.integer.lastIndex = offset;
    const match = pattern.integer.exec(input);

    if (match) {
        return [
            pattern.integer.lastIndex,
            parseInt(match[1].replace(/_/g, ''), 10),
            undefined
        ];
    } else {
        return [offset, undefined, 'integer'];
    }
}

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
export const hex = (input: string, offset: number): ParseResult => {
    pattern.hex.lastIndex = offset;
    const match = pattern.hex.exec(input);

    if (match) {
        return [
            pattern.hex.lastIndex,
            parseInt(match[1].replace('0x', '').replace(/_/g, ''), 16),
            undefined
        ];
    } else {
        return [offset, undefined, 'hexadecimal'];
    }
}

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
export const booleanValue = (input: string, offset: number): ParseResult => {
    pattern.boolean.lastIndex = offset;
    const match = pattern.boolean.exec(input);

    if (match) {
        return [pattern.boolean.lastIndex, Boolean(match[1]), undefined];
    } else {
        return [offset, undefined, 'boolean'];
    }
}

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
export const nullValue = (input: string, offset: number): ParseResult => {
    pattern.null.lastIndex = offset;
    const match = pattern.null.exec(input);

    if (match) {
        return [pattern.null.lastIndex, null, undefined];
    } else {
        return [offset, undefined, 'null'];
    }
}
