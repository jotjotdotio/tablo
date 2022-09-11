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
    exports.TableFormat = void 0;
    class TableFormat {
        constructor(rules) {
            // Rules are stored as a mapping from [row,col,row,col] to property list,
            // so we need to convert rules in [A], [A:B], [1], [1:2], and [A1] formats
            // to [A1:B2] format. Infinity is used as a default max value if none is
            // supplied in the rule.
            const rule = /^([A-Z]+)(?::([A-Z]+))?$|^([0-9]+)(?::([0-9]+))?$|^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$/;
            //const cell = /(?:([A-Z]+[\d]+):([A-Z]+[\d]+))|(?:([A-Z]+):([A-Z]+))|(?:([\d]+):([\d]+))|([A-Z]+[\d]+)[^\S\r\n]*/y;
            this.rules = Object.entries(rules).reduce((result, [key, props]) => {
                const match = rule.exec(key);
                if (!match) {
                    return result;
                }
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
                    const bounds = `${startCol},${startRow},${endCol},${endRow}`;
                    const row = [bounds, key, props];
                    result.push(row);
                }
                return result;
            }, []);
        }
        getProps(col, row) {
            const numericColumn = this.alphaToInt(col);
            return this.rules.filter((rule) => {
                const [bounds, _key, _props] = rule;
                const [startCol, startRow, endCol, endRow] = bounds.split(',').map((index) => parseFloat(index));
                return (row >= startRow &&
                    row <= endRow &&
                    numericColumn >= startCol &&
                    numericColumn <= endCol);
            }).reduce((result, rule) => {
                const [_bounds, _key, props] = rule;
                return result.concat(props);
            }, []);
        }
        getRules() {
            return this.rules.reduce((reducer, rule) => {
                const [_bounds, key, props] = rule;
                reducer[key] = props;
                return reducer;
            }, {});
        }
        alphaToInt(index) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return index.split('').reverse().reduce((sum, char, idx) => {
                return sum + alphabet.indexOf(char) * Math.pow(26, idx);
            }, 0);
        }
    }
    exports.TableFormat = TableFormat;
});
