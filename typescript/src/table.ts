export type label = string | null;
export type element = string | number | boolean | null;
export type row = element[];

export class Table {
    public header: label[];
    public data: row[];
    public format: any;
    public breaks: number[];

    public constructor(header: label[] | null, rows: row[], format?: object) {
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

    public unparse() {
        let header = '';
        if (this.header !== null || this.header.length) {
            header = this.header.map(val => `"${val}"`).join(',') + '\n';
        }
        let data = '';
        data = this.data.map(row => row.map(elt => {
            switch (typeof elt) {
            case 'string': return `"${elt}"`
            case 'number': return elt.toString(10);
            case 'boolean': return elt ? 'true' : 'false';
            case 'object':
                if (elt === null) {
                    return '-';
                } // else if (elt instanceof Date) {
                //     return elt.toISOString();
                // }
            }
        }).join(',')).join('\n');
        return header + '=\n' + data;
    }

    private alphaToInt (index: string) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return index.split('').reverse().reduce((sum, char, idx) => {
            return sum + alphabet.indexOf(char) * Math.pow(26, idx);
        }, 0);
    }
}
