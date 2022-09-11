import { Table } from "./table";
export interface SerializationStrategy {
    serialize(table: Table): string;
}
export declare class TabloSerializer implements SerializationStrategy {
    serialize(table: Table): string;
    private serializeHeader;
    private serializeData;
    private serializeItem;
    private serializeFormat;
}
export declare class HtmlSerializer implements SerializationStrategy {
    serialize(table: Table): string;
    private serializeHeader;
    private serializeData;
    private serializeItem;
}
export declare class CsvSerializer implements SerializationStrategy {
    serialize(table: Table): string;
}
