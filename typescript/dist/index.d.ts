import { SerializationStrategy } from './serializers';
import { Table } from './table';
export declare const parse: (input: string) => any;
export declare const serialize: (table: Table) => string;
export declare const setSerializer: (serializer: new () => SerializationStrategy) => void;
