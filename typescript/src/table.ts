import { TableFormat } from "./format";
import { label, row } from "./types";

export class Table {
    public header: label[];
    public data: row[];
    public format: TableFormat;
    public breaks: number[];

    public constructor(header: label[] | null, rows: row[], format?: TableFormat) {
        this.header = header;
        this.data = rows;
        this.format = format;
        this.breaks = [];
    }

    public concat(rows: row[]) {
        this.data.push(...rows);
    }

    public get(column: number | string, row: number) {
        const columnNum = typeof column === 'number' ? column : this.alphaToInt(column);
        return this.data[row][columnNum];
    }

    public getRow(row: number) {
        return this.data[row];
    }

    private alphaToInt (index: string) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return index.split('').reverse().reduce((sum, char, idx) => {
            return sum + alphabet.indexOf(char) * Math.pow(26, idx);
        }, 0);
    }
}
