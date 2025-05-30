/**
 * Minimum bits needed to store value.
 *
 * @param {number} value
 * @returns {number}
 */
export function bitWidth(value: number): number;
/**
 * Read values from a run-length encoded/bit-packed hybrid encoding.
 *
 * If length is zero, then read int32 length at the start.
 *
 * @param {DataReader} reader
 * @param {number} width - width of each bit-packed group
 * @param {number} length - length of the encoded data
 * @param {DecodedArray} output
 */
export function readRleBitPackedHybrid(reader: DataReader, width: number, length: number, output: DecodedArray): void;
/**
 * @param {DataReader} reader
 * @param {number} count
 * @param {ParquetType} type
 * @param {number | undefined} typeLength
 * @returns {DecodedArray}
 */
export function byteStreamSplit(reader: DataReader, count: number, type: ParquetType, typeLength: number | undefined): DecodedArray;
import type { DataReader } from '../src/types.d.ts';
import type { DecodedArray } from '../src/types.d.ts';
import type { ParquetType } from '../src/types.d.ts';
//# sourceMappingURL=encoding.d.ts.map