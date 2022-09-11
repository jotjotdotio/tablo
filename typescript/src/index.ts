import * as Parse from './parse';
import { SerializationStrategy, TabloSerializer } from './serializers';
import { Table } from './table';


let defaultSerializer: SerializationStrategy = new TabloSerializer();

export const parse = (input: string) => {
    const [_ignore, data, error] = Parse.document(input, 0);

    if (error) {
        throw error;
    } else {
        return data;
    }
};

export const serialize = (table: Table) => {
    return defaultSerializer.serialize(table);
};

export const setSerializer = (serializer: new () => SerializationStrategy) => {
    defaultSerializer = new serializer();
}
