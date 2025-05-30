/**
 * Convert known types from primitive to rich, and dereference dictionary.
 *
 * @param {DecodedArray} data series of primitive types
 * @param {DecodedArray | undefined} dictionary
 * @param {SchemaElement} schemaElement
 * @param {Encoding} encoding
 * @param {boolean} [utf8] decode bytes as utf8?
 * @returns {DecodedArray} series of rich types
 */
export function convertWithDictionary(data: DecodedArray, dictionary: DecodedArray | undefined, schemaElement: SchemaElement, encoding: Encoding, utf8?: boolean): DecodedArray;
/**
 * Convert known types from primitive to rich.
 *
 * @param {DecodedArray} data series of primitive types
 * @param {SchemaElement} schemaElement
 * @param {boolean} [utf8] decode bytes as utf8?
 * @returns {DecodedArray} series of rich types
 */
export function convert(data: DecodedArray, schemaElement: SchemaElement, utf8?: boolean): DecodedArray;
/**
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function parseDecimal(bytes: Uint8Array): number;
/**
 * @param {Uint8Array | undefined} bytes
 * @returns {number | undefined}
 */
export function parseFloat16(bytes: Uint8Array | undefined): number | undefined;
import type { DecodedArray } from '../src/types.d.ts';
import type { SchemaElement } from '../src/types.d.ts';
import type { Encoding } from '../src/types.d.ts';
//# sourceMappingURL=convert.d.ts.map