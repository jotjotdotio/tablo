export declare type label = string | null;
export declare type element = string | number | boolean | null;
export declare type row = element[];
export declare class Table {
    header: label[];
    rows: row[];
    constructor(header: label[], rows: row[]);
    concat(rows: row[]): void;
    getRow(row: number): row;
    getCell(row: number, column: string): element;
    unparse(): string;
    private alphaToInt;
}
