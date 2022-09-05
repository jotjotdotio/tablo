export declare class CellFormat {
    private rules;
    constructor(rules: {
        [key: string]: string[];
    });
    getProps(row: number, col: string): string[];
    private alphaToInt;
}
