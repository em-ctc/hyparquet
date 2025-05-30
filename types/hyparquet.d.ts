/**
 * This is a helper function to read parquet row data as a promise.
 * It is a wrapper around the more configurable parquetRead function.
 *
 * @param {Omit<ParquetReadOptions, 'onComplete'>} options
 * @returns {Promise<Record<string, any>[]>} resolves when all requested rows and columns are parsed
*/
export function parquetReadObjects(options: Omit<ParquetReadOptions, "onComplete">): Promise<Record<string, any>[]>;
export { parquetRead };
export { parquetQuery } from "./query.js";
export { snappyUncompress } from "./snappy.js";
/**
 * <T>
 */
export type Awaitable<T extends unknown> = import("../src/types.d.ts").Awaitable<T>;
export type AsyncBuffer = import("../src/types.d.ts").AsyncBuffer;
export type DataReader = import("../src/types.d.ts").DataReader;
export type FileMetaData = import("../src/types.d.ts").FileMetaData;
export type SchemaTree = import("../src/types.d.ts").SchemaTree;
export type SchemaElement = import("../src/types.d.ts").SchemaElement;
export type ParquetType = import("../src/types.d.ts").ParquetType;
export type FieldRepetitionType = import("../src/types.d.ts").FieldRepetitionType;
export type ConvertedType = import("../src/types.d.ts").ConvertedType;
export type TimeUnit = import("../src/types.d.ts").TimeUnit;
export type LogicalType = import("../src/types.d.ts").LogicalType;
export type LogicalTypeType = import("../src/types.d.ts").LogicalTypeType;
export type RowGroup = import("../src/types.d.ts").RowGroup;
export type ColumnChunk = import("../src/types.d.ts").ColumnChunk;
export type ColumnMetaData = import("../src/types.d.ts").ColumnMetaData;
export type Encoding = import("../src/types.d.ts").Encoding;
export type CompressionCodec = import("../src/types.d.ts").CompressionCodec;
export type Compressors = import("../src/types.d.ts").Compressors;
export type KeyValue = import("../src/types.d.ts").KeyValue;
export type Statistics = import("../src/types.d.ts").Statistics;
export type PageType = import("../src/types.d.ts").PageType;
export type PageHeader = import("../src/types.d.ts").PageHeader;
export type DataPageHeader = import("../src/types.d.ts").DataPageHeader;
export type DictionaryPageHeader = import("../src/types.d.ts").DictionaryPageHeader;
export type DecodedArray = import("../src/types.d.ts").DecodedArray;
export type OffsetIndex = import("../src/types.d.ts").OffsetIndex;
export type ColumnIndex = import("../src/types.d.ts").ColumnIndex;
export type BoundaryOrder = import("../src/types.d.ts").BoundaryOrder;
export type ColumnData = import("../src/types.d.ts").ColumnData;
export type ParquetReadOptions = import("../src/types.d.ts").ParquetReadOptions;
import { parquetRead } from './read.js';
export { parquetMetadata, parquetMetadataAsync, parquetSchema } from "./metadata.js";
export { asyncBufferFromFile, asyncBufferFromUrl, byteLengthFromUrl, cachedAsyncBuffer, flatten, toJson } from "./utils.js";
//# sourceMappingURL=hyparquet.d.ts.map