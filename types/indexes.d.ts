/**
 * @param {DataReader} reader
 * @param {SchemaElement} schema
 * @returns {ColumnIndex}
 */
export function readColumnIndex(reader: DataReader, schema: SchemaElement): ColumnIndex;
/**
 * @param {DataReader} reader
 * @returns {OffsetIndex}
 */
export function readOffsetIndex(reader: DataReader): OffsetIndex;
import type { DataReader } from '../src/types.d.ts';
import type { SchemaElement } from '../src/types.d.ts';
import type { ColumnIndex } from '../src/types.d.ts';
import type { OffsetIndex } from '../src/types.d.ts';
//# sourceMappingURL=indexes.d.ts.map