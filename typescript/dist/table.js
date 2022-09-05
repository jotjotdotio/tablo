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
    exports.Table = void 0;
    class Table {
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
    }
    exports.Table = Table;
});
