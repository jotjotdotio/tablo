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
    exports.CsvSerializer = exports.HtmlSerializer = exports.TabloSerializer = void 0;
    const columnLabels = {};
    function intToAlpha(value) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (columnLabels[value] === undefined) {
            let result = '';
            for (let v = value; v > 0; v = Math.floor(v / 26)) {
                result = alphabet[v % 26] + result;
            }
            columnLabels[value] = result || 'A';
        }
        return columnLabels[value];
    }
    class TabloSerializer {
        serialize(table) {
            const header = this.serializeHeader(table);
            const data = this.serializeData(table);
            const format = this.serializeFormat(table.format);
            return `${header}=0.1\n${data}\n${format}`;
        }
        serializeHeader(table) {
            if (table.header === null || table.header.length === 0) {
                return '';
            }
            return table.header.map(val => `"${val}"`).join(',') + '\n';
        }
        serializeData(table) {
            return table.data.map(row => row.map(elt => this.serializeItem(elt)).join(',')).join('\n');
        }
        serializeItem(elt) {
            switch (typeof elt) {
                case 'string': return `"${elt}"`;
                case 'number': return elt.toString(10);
                case 'boolean': return elt ? 'true' : 'false';
                case 'object':
                    if (elt === null) {
                        return '-';
                    } // else if (elt instanceof Date) {
                //     return '#' + elt.toISOString();
                // }
            }
        }
        serializeFormat(format) {
            if (format == null) {
                return '';
            }
            const lines = Object.entries(format.getRules()).map((entry) => {
                const [key, props] = entry;
                return `${key} {${props.join(', ')}}\n`;
            });
            return `*\n${lines}`;
        }
    }
    exports.TabloSerializer = TabloSerializer;
    class HtmlSerializer {
        serialize(table) {
            const header = this.serializeHeader(table);
            const data = this.serializeData(table);
            return `<table>${header}${data}\n</table>`;
        }
        serializeHeader(table) {
            if (table.header.length === 0) {
                return '';
            }
            const items = table.header.map((item, index) => {
                const col = intToAlpha(index);
                const value = this.serializeItem(item);
                return `<td data-col-index="${col}">${value}</td>`;
            });
            return `\n  <thead><tr>\n    ${items.join('\n    ')}\n  </tr></thead>`;
        }
        serializeData(table) {
            const rows = table.data.map((row, rowIndex) => {
                const tableRow = row.map((item, column) => {
                    const columnStr = intToAlpha(column);
                    const value = this.serializeItem(item);
                    const props = table.format ? table.format.getProps(columnStr, rowIndex) : [];
                    const classAttr = props.length ? ` class="${props.join(' ')}"` : '';
                    return `<td data-col-index="${columnStr}"${classAttr}>${value}</td>`;
                });
                return `<tr data-row-index="${rowIndex}">\n      ${tableRow.join('\n      ')}\n    </tr>`;
            });
            return `\n  <tbody>\n    ${rows.join('\n    ')}\n  </tbody>`;
        }
        serializeItem(elt) {
            switch (typeof elt) {
                case 'string': return elt;
                case 'number': return elt.toString(10);
                case 'boolean': return elt ? 'True' : 'False';
                case 'object':
                    if (elt === null) {
                        return '';
                    } // else if (elt instanceof Date) {
                //     return '#' + elt.toISOString();
                // }
            }
        }
    }
    exports.HtmlSerializer = HtmlSerializer;
    class CsvSerializer {
        serialize(table) {
            return '';
        }
    }
    exports.CsvSerializer = CsvSerializer;
});
