export class CellFormat {
    private rules: {[key: string]: string[]};

    public constructor (rules: {[key: string]: string[]}) {
        // Rules are stored as a mapping from [row,col,row,col] to property list,
        // so we need to convert rules in [A], [A:B], [1], [1:2], and [A1] formats
        // to [A1:B2] format. Infinity is used as a default max value if none is
        // supplied in the rule.
        const rule = /^([A-Z]+)(?::([A-Z]+))?$|^([0-9]+)(?::([0-9]+))?$|^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$/;
        //const cell = /(?:([A-Z]+[\d]+):([A-Z]+[\d]+))|(?:([A-Z]+):([A-Z]+))|(?:([\d]+):([\d]+))|([A-Z]+[\d]+)[^\S\r\n]*/y;

        this.rules = {};

        for (let key in rules) {
            const match = rule.exec(key);
            if (!match) {
                continue;
            } else {
                let startRow = 0, endRow = Infinity, startCol = 0, endCol = Infinity;

                if (match[1] !== undefined) {
                    // Column or column range
                    startCol = this.alphaToInt(match[1]);
                    endCol = (match[2] !== undefined) ? this.alphaToInt(match[2]) : startCol;
                } else if (match[3] !== undefined) {
                    // Row or row range
                    startRow = parseInt(match[3], 10);
                    endRow = (match[4] !== undefined) ? parseInt(match[4], 10) : startRow;
                } else if (match[5] !== undefined) {
                    // Cell or rectangular grid
                    startCol = this.alphaToInt(match[5]);
                    startRow = parseInt(match[6], 10);
                    endCol = (match[7] !== undefined) ? this.alphaToInt(match[7]) : startCol;
                    endRow = (match[8] !== undefined) ? parseInt(match[8], 10) : startRow;
                }

                if (startRow <= endRow && startCol <= endCol) {
                    this.rules[`${startRow},${startCol},${endRow},${endCol}`] = rules[key];
                }
            }
        }
    }

    public getProps (row: number, col: string) {
        const numericColumn = this.alphaToInt(col);

        return Object.keys(this.rules).filter((bounds) => {
                const [startRow, startCol, endRow, endCol] = 
                    bounds.split(',').map((index) => parseFloat(index));
                return (
                    row >= startRow &&
                    row <= endRow &&
                    numericColumn >= startCol &&
                    numericColumn <= endCol
                );
            }).reduce((result: string[], key) => {
                return result.concat(this.rules[key]);
            }, []);
    }

    private alphaToInt (index: string) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return index.split('').reverse().reduce((sum, char, idx) => {
            return sum + alphabet.indexOf(char) * Math.pow(26, idx);
        }, 0);
    }
}
