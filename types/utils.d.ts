/**
 * Replace bigint, date, etc with legal JSON types.
 *
 * @param {any} obj object to convert
 * @returns {unknown} converted object
 */
export function toJson(obj: any): unknown;
/**
 * Concatenate two arrays fast.
 *
 * @param {any[]} aaa first array
 * @param {DecodedArray} bbb second array
 */
export function concat(aaa: any[], bbb: DecodedArray): void;
/**
 * Deep equality comparison
 *
 * @param {any} a First object to compare
 * @param {any} b Second object to compare
 * @returns {boolean} true if objects are equal
 */
export function equals(a: any, b: any): boolean;
/**
 * Get the byte length of a URL using a HEAD request.
 * If requestInit is provided, it will be passed to fetch.
 *
 * @param {string} url
 * @param {RequestInit} [requestInit] fetch options
 * @param {typeof globalThis.fetch} [customFetch] fetch function to use
 * @returns {Promise<number>}
 */
export function byteLengthFromUrl(url: string, requestInit?: RequestInit, customFetch?: typeof globalThis.fetch): Promise<number>;
/**
 * Construct an AsyncBuffer for a URL.
 * If byteLength is not provided, will make a HEAD request to get the file size.
 * If fetch is provided, it will be used instead of the global fetch.
 * If requestInit is provided, it will be passed to fetch.
 *
 * @param {object} options
 * @param {string} options.url
 * @param {number} [options.byteLength]
 * @param {typeof globalThis.fetch} [options.fetch] fetch function to use
 * @param {RequestInit} [options.requestInit]
 * @returns {Promise<AsyncBuffer>}
 */
export function asyncBufferFromUrl({ url, byteLength, requestInit, fetch: customFetch }: {
    url: string;
    byteLength?: number | undefined;
    fetch?: typeof fetch | undefined;
    requestInit?: RequestInit | undefined;
}): Promise<AsyncBuffer>;
/**
 * Construct an AsyncBuffer for a local file using node fs package.
 *
 * @param {string} filename
 * @returns {Promise<AsyncBuffer>}
 */
export function asyncBufferFromFile(filename: string): Promise<AsyncBuffer>;
/**
 * Returns a cached layer on top of an AsyncBuffer. For caching slices of a file
 * that are read multiple times, possibly over a network.
 *
 * @param {AsyncBuffer} file file-like object to cache
 * @param {{ minSize?: number }} [options]
 * @returns {AsyncBuffer} cached file-like object
 */
export function cachedAsyncBuffer({ byteLength, slice }: AsyncBuffer, { minSize }?: {
    minSize?: number;
}): AsyncBuffer;
/**
 * Flatten a list of lists into a single list.
 *
 * @param {DecodedArray[]} [chunks]
 * @returns {DecodedArray}
 */
export function flatten(chunks?: DecodedArray[]): DecodedArray;
import type { DecodedArray } from '../src/types.d.ts';
import type { AsyncBuffer } from '../src/types.d.ts';
//# sourceMappingURL=utils.d.ts.map