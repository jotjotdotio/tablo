import { TableFormat } from "./format";
import { Table } from "./table";
import { element } from "./types";


const columnLabels = {};

function intToAlpha(value: number) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    if (columnLabels[value] === undefined) {
        let result = '';
        for (let v = value; v > 0; v = Math.floor(v / 26)) {
            result = alphabet[v % 26] + result;
        }

        columnLabels[value] = result || 'A'
    }

    return columnLabels[value];
}

export interface SerializationStrategy {
    serialize(table: Table): string;
}

export class TabloSerializer implements SerializationStrategy {
    public serialize(table: Table) {
        const header = this.serializeHeader(table);
        const data = this.serializeData(table);
        const format = this.serializeFormat(table.format);
        return `${header}=0.1\n${data}\n${format}`;
    }

    private serializeHeader(table: Table) {
        if (table.header === null || table.header.length === 0) {
            return '';
        }

        return table.header.map(val => `"${val}"`).join(',') + '\n';
    }

    private serializeData(table: Table) {
        return table.data.map(
            row => row.map(
                elt => this.serializeItem(elt)
        ).join(',')).join('\n');
    }

    private serializeItem(elt: element) {
        switch (typeof elt) {
        case 'string': return `"${elt}"`
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

    private serializeFormat(format: TableFormat) {
        if (format == null) {
            return '';
        }

        const lines = Object.entries(format.getRules()).map((entry: [string, string[]]) => {
            const [key, props] = entry;
            return `${key} {${props.join(', ')}}\n`;
        });
        return `*\n${lines}`;
    }
}

export class HtmlSerializer implements SerializationStrategy {
    public serialize(table: Table) {
        const header = this.serializeHeader(table);
        const data = this.serializeData(table);
        return `<table>${header}${data}\n</table>`;
    }

    private serializeHeader(table: Table) {
        if (table.header.length === 0) { return ''; }

        const items = table.header.map((item, index) => {
            const col = intToAlpha(index);
            const value = this.serializeItem(item);
            return `<td data-col-index="${col}">${value}</td>`;
        });

        return `\n  <thead><tr>\n    ${items.join('\n    ')}\n  </tr></thead>`;
    }

    private serializeData(table: Table) {
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

    private serializeItem(elt: element) {
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

export class CsvSerializer implements SerializationStrategy {
    public serialize(table: Table) {
        return '';
    }
}
