/**
 * @import {AsyncColumn, AsyncRowGroup, DecodedArray, GroupPlan, ParquetReadOptions, QueryPlan, RowGroup, SchemaTree} from './types.js'
 */
/**
 * Read a row group from a file-like object.
 *
 * @param {ParquetReadOptions} options
 * @param {QueryPlan} plan
 * @param {GroupPlan} groupPlan
 * @returns {AsyncRowGroup} resolves to column data
 */
export function readRowGroup(options: ParquetReadOptions, { metadata, columns }: QueryPlan, groupPlan: GroupPlan): AsyncRowGroup;
/**
 * @param {AsyncRowGroup} asyncGroup
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {string[] | undefined} columns
 * @param {'object' | 'array'} [rowFormat]
 * @returns {Promise<Record<string, any>[]>} resolves to row data
 */
export function asyncGroupToRows({ asyncColumns }: AsyncRowGroup, selectStart: number, selectEnd: number, columns: string[] | undefined, rowFormat?: "object" | "array"): Promise<Record<string, any>[]>;
/**
 * Assemble physical columns into top-level columns asynchronously.
 *
 * @param {AsyncRowGroup} asyncRowGroup
 * @param {SchemaTree} schemaTree
 * @returns {AsyncRowGroup}
 */
export function assembleAsync(asyncRowGroup: AsyncRowGroup, schemaTree: SchemaTree): AsyncRowGroup;
import type { ParquetReadOptions } from './types.js';
import type { QueryPlan } from './types.js';
import type { GroupPlan } from './types.js';
import type { AsyncRowGroup } from './types.js';
import type { SchemaTree } from './types.js';
//# sourceMappingURL=rowgroup.d.ts.map