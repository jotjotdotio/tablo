export declare class TableFormat {
    private rules;
    constructor(rules: {
        [key: string]: string[];
    });
    getProps(col: string, row: number): string[];
    getRules(): {};
    private alphaToInt;
}
