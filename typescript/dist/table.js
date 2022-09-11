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
        constructor(header, rows, format) {
            this.header = header;
            this.data = rows;
            this.format = format;
            this.breaks = [];
        }
        concat(rows) {
            this.data.push(...rows);
        }
        get(column, row) {
            const columnNum = typeof column === 'number' ? column : this.alphaToInt(column);
            return this.data[row][columnNum];
        }
        getRow(row) {
            return this.data[row];
        }
        alphaToInt(index) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return index.split('').reverse().reduce((sum, char, idx) => {
                return sum + alphabet.indexOf(char) * Math.pow(26, idx);
            }, 0);
        }
    }
    exports.Table = Table;
});
