

export type label = string | null;
export type element = string | number | boolean | null;
export type row = element[];

export class Table {
    public header: label[];
    public rows: row[];

    public constructor(header: label[], rows: row[]) {
        this.header = header;
        this.rows = rows;
    }

    public concat(rows: row[]) {
        this.rows.push(...rows);
    }

    public getRow(row: number) {
        return this.rows[row];
    }

    public getCell(row: number, column: string) {
        const columnNum = this.alphaToInt(column);
        return this.rows[row][columnNum];
    }

    public unparse() {
        return this.header.toString() + '=\n' + this.rows.toString();
    }

    private alphaToInt (index: string) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return index.split('').reverse().reduce((sum, char, idx) => {
            return sum + alphabet.indexOf(char) * (10 ^ idx);
        }, 0);
    }
}