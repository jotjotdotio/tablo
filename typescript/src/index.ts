import * as Parse from './parse';
import {label, row} from './table';

export const parse = (input: string) => {
    const [_ignore, data, error] = Parse.document(input, 0);

    if (error) {
        throw error;
    } else {
        return data;
    }
};

export const unparse = (header: label[], data: row[]) => {
    const hh = doHeader(header);
    const dd = doData(data);

    return `${hh}\n=\n${dd}\n`;
};

const doHeader = (header: label[]) => {
    return '';
}

const doData = (data: row[]) => {
    return "";
}
