

export const parse = () => {

};

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

	formatRngSel: /\[([A-Z]+(?::[A-Z]+)?|[\d]+(?::[\d]+)?|[A-Z]+[\d]+(?::[A-Z]+[\d]+)?)\][^\S\r\n]*/y,
    // Matches cell specifiers in the form [A1:Z9], [B:F], [0:9], or [D4]
    cellRange: /\[(?:([A-Z]+[\d]+):([A-Z]+[\d]+)|([A-Z]+):([A-Z]+)|([\d]+):([\d]+)|([A-Z]+[\d]+))\][^\S\r\n]*/y,
	propName: /(plain|bold|italic|underline|strike|normal|mono|black|red|orange|yellow|green|blue|violet|grey|white)[^\S\r\n]*/y,
};

type label = string | null;
type header = label[];

type element = string | number | boolean | null;
type row = element[];
type data = row[];

type format = {[key: string]: string[]};
type parseResult = [offset: number, result: any, error: string | undefined];
type rule = (input: string, offset: number) => parseResult;

enum Token {
    Equals,
    Tilde,
    Star,
    Comma,
    Newline,
    OpenBrace,
    CloseBrace
};

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
const concat = (input: string, offset: number, rules: rule[]): parseResult => {
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
const altern = (input: string, offset: number, rules: rule[]): parseResult => {
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
const repeat = (input: string, offset: number, rules: rule[]): parseResult => {
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

const _formatRule = (input: string, offset: number): parseResult => {
    let [position, range, error] = _cellRange(input, offset);
    
    if (error) {
        return [position, undefined, error];
    }
    
    let props;
    [position, props, error] = _properties(input, position);

    if (error) {
        return [position, undefined, error];
    } else {
        return [position, {[range]: props}, undefined];
    }
}

const _cellRange = (input: string, offset: number): parseResult => {
    // TODO: Change to use pattern.cellRange
    pattern.formatRngSel.lastIndex = offset;
    let match = pattern.formatRngSel.exec(input);

    if (match) {
        return [pattern.formatRngSel.lastIndex, match[1], undefined];
    } else {
        return [offset, undefined, 'Range Selector'];
    }
}

const _properties = (input: string, offset: number): parseResult => {
    let [position, _ignore, error] = _openBrace(input, offset);

    if (error) {
        return [position, undefined, error];
    }

    let prop;
    [position, prop, error] = _propName(input, position);

    if (error) {
        return [position, undefined, error];
    }

    let props;
    [position, props, error] = repeat(input, position, [_comma, _propName]);

    if (error) {
        return [position, undefined, error];
    }

    [position, _ignore, error] = _closeBrace(input, position);

    if (error) {
        return [position, undefined, error];
    } else {
        const filteredProps = props.filter((prop: string | Token) => prop !== Token.Comma);
        filteredProps.unshift(prop);
        return [position, filteredProps, undefined];
    }
}

const _row = (input: string, offset: number): parseResult => {
    let [position, elt, error] = _element(input, offset);

    if (error) {
        [position, elt, error] = concat(input, offset, [_tilde, _newline]);

        if (error) {
            return [position, undefined, "element or '~'"];
        } else {
            return [position, Token.Tilde, undefined];
        }
    }

    let elts;
    [position, elts, error] = repeat(input, position, [_comma, _element]);

    if (error) {
        return [position, undefined, error];
    }

    let _ignore;
    [position, _ignore, error] = _newline(input, position);

    if (error) {
        return [position, undefined, 'newline at end of row'];
    }

    const items = elts.filter((elt: any) => elt !== Token.Comma)
    items.unshift(elt);
    return [position, items, undefined];
}

const _element = (input: string, offset: number): parseResult => {
    return altern(input, offset, [_string, _number, _boolean, _null]);
}

const _label = (input: string, offset: number): parseResult => {
    return altern(input, offset, [_string, _null]);
}

const _equals = (input: string, offset: number): parseResult => {
    pattern.equals.lastIndex = offset;
    const match = pattern.equals.exec(input);
    
    if (match) {
        return [pattern.equals.lastIndex, Token.Equals, undefined];
    } else {
        return [offset, undefined, 'header separator'];
    }
}

const _star = (input: string, offset: number): parseResult => {
    pattern.star.lastIndex = offset;
    const match = pattern.star.exec(input);
    if (match) {
        return [pattern.star.lastIndex, Token.Star, undefined];
    } else {
        return [offset, undefined, 'format separator'];
    }
}

const _tilde = (input: string, offset: number): parseResult => {
    pattern.tilde.lastIndex = offset;
    const match = pattern.tilde.exec(input);
    if (match) {
        return [pattern.tilde.lastIndex, Token.Tilde, undefined];
    } else {
        return [offset, undefined, 'section separator'];
    }
}

const _comma = (input: string, offset: number): parseResult => {
    pattern.comma.lastIndex = offset;
    const match = pattern.comma.exec(input);
    if (match) {
        return [pattern.comma.lastIndex, Token.Comma, undefined];
    } else {
        return [offset, undefined, 'comma'];
    }
}

const _newline = (input: string, offset: number): parseResult => {
    pattern.newline.lastIndex = offset;
    const match = pattern.newline.exec(input);
    if (match) {
        return [pattern.newline.lastIndex, Token.Newline, undefined];
    } else {
        return [offset, undefined, 'newline'];
    }
}

const _openBrace = (input: string, offset: number): parseResult => {
    pattern.openBrace.lastIndex = offset;
    const match = pattern.openBrace.exec(input);
    
    if (match) {
        return [pattern.openBrace.lastIndex, Token.OpenBrace, undefined];
    } else {
        return [offset, undefined, '"{"'];
    }
}

const _closeBrace = (input: string, offset: number): parseResult => {
    pattern.closeBrace.lastIndex = offset;
    const match = pattern.closeBrace.exec(input);
    
    if (match) {
        return [pattern.closeBrace.lastIndex, Token.CloseBrace, undefined];
    } else {
        return [offset, undefined, '"}"'];
    }
}

const _propName = (input: string, offset: number): parseResult => {
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
 * @returns an [offset, result, error] vector
 *
 * If successful, the offset will be the location of the last character of the
 * string literal, the result will be the matched string with escape sequences
 * converted, and error will be undefined. If an error is encountered, offset
 * will be the initial start position, result will be undefined, and error 
 * will be 'string'.
 */
const _string = (input: string, offset: number): parseResult => {
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
const _number = (input: string, offset: number): parseResult => {
    return altern(input, offset, [_scientific, _hex, _float, _int]);
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
const _scientific = (input: string, offset: number): parseResult => {
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
const _float = (input: string, offset: number): parseResult => {
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
const _int = (input: string, offset: number): parseResult => {
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
const _hex = (input: string, offset: number): parseResult => {
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
const _boolean = (input: string, offset: number): parseResult => {
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
const _null = (input: string, offset: number): parseResult => {
    pattern.null.lastIndex = offset;
    const match = pattern.null.exec(input);
    
    if (match) {
        return [pattern.null.lastIndex, null, undefined];
    } else {
        return [offset, undefined, 'null'];
    }
}
