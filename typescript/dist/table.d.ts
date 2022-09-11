import { TableFormat } from "./format";
import { label, row } from "./types";
export declare class Table {
    header: label[];
    data: row[];
    format: TableFormat;
    breaks: number[];
    constructor(header: label[] | null, rows: row[], format?: TableFormat);
    concat(rows: row[]): void;
    get(column: number | string, row: number): import("./types").element;
    getRow(row: number): row;
    private alphaToInt;
}
