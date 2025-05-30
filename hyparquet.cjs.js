"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hyparquet.js
var hyparquet_exports = {};
__export(hyparquet_exports, {
  asyncBufferFromFile: () => asyncBufferFromFile,
  asyncBufferFromUrl: () => asyncBufferFromUrl,
  byteLengthFromUrl: () => byteLengthFromUrl,
  cachedAsyncBuffer: () => cachedAsyncBuffer,
  flatten: () => flatten,
  parquetMetadata: () => parquetMetadata,
  parquetMetadataAsync: () => parquetMetadataAsync,
  parquetQuery: () => parquetQuery,
  parquetRead: () => parquetRead,
  parquetReadObjects: () => parquetReadObjects,
  parquetSchema: () => parquetSchema,
  snappyUncompress: () => snappyUncompress,
  toJson: () => toJson
});
module.exports = __toCommonJS(hyparquet_exports);

// src/constants.js
var ParquetType = [
  "BOOLEAN",
  "INT32",
  "INT64",
  "INT96",
  // deprecated
  "FLOAT",
  "DOUBLE",
  "BYTE_ARRAY",
  "FIXED_LEN_BYTE_ARRAY"
];
var Encoding = [
  "PLAIN",
  "GROUP_VAR_INT",
  // deprecated
  "PLAIN_DICTIONARY",
  "RLE",
  "BIT_PACKED",
  // deprecated
  "DELTA_BINARY_PACKED",
  "DELTA_LENGTH_BYTE_ARRAY",
  "DELTA_BYTE_ARRAY",
  "RLE_DICTIONARY",
  "BYTE_STREAM_SPLIT"
];
var FieldRepetitionType = [
  "REQUIRED",
  "OPTIONAL",
  "REPEATED"
];
var ConvertedType = [
  "UTF8",
  "MAP",
  "MAP_KEY_VALUE",
  "LIST",
  "ENUM",
  "DECIMAL",
  "DATE",
  "TIME_MILLIS",
  "TIME_MICROS",
  "TIMESTAMP_MILLIS",
  "TIMESTAMP_MICROS",
  "UINT_8",
  "UINT_16",
  "UINT_32",
  "UINT_64",
  "INT_8",
  "INT_16",
  "INT_32",
  "INT_64",
  "JSON",
  "BSON",
  "INTERVAL"
];
var CompressionCodec = [
  "UNCOMPRESSED",
  "SNAPPY",
  "GZIP",
  "LZO",
  "BROTLI",
  "LZ4",
  "ZSTD",
  "LZ4_RAW"
];
var PageType = [
  "DATA_PAGE",
  "INDEX_PAGE",
  "DICTIONARY_PAGE",
  "DATA_PAGE_V2"
];

// src/convert.js
var dayMillis = 864e5;
function convertWithDictionary(data, dictionary, schemaElement, encoding, utf8) {
  if (dictionary && encoding.endsWith("_DICTIONARY")) {
    let output = data;
    if (data instanceof Uint8Array && !(dictionary instanceof Uint8Array)) {
      output = new dictionary.constructor(data.length);
    }
    for (let i = 0; i < data.length; i++) {
      output[i] = dictionary[data[i]];
    }
    return output;
  } else {
    return convert(data, schemaElement, utf8);
  }
}
function convert(data, schemaElement, utf8 = true) {
  const { type, converted_type: ctype, logical_type: ltype } = schemaElement;
  if (ctype === "DECIMAL") {
    const scale = schemaElement.scale || 0;
    const factor = 10 ** -scale;
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      if (data[0] instanceof Uint8Array) {
        arr[i] = parseDecimal(data[i]) * factor;
      } else {
        arr[i] = Number(data[i]) * factor;
      }
    }
    return arr;
  }
  if (!ctype && type === "INT96") {
    return Array.from(data).map(parseInt96Date);
  }
  if (ctype === "DATE") {
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = new Date(data[i] * dayMillis);
    }
    return arr;
  }
  if (ctype === "TIMESTAMP_MILLIS") {
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = new Date(Number(data[i]));
    }
    return arr;
  }
  if (ctype === "TIMESTAMP_MICROS") {
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = new Date(Number(data[i] / 1000n));
    }
    return arr;
  }
  if (ctype === "JSON") {
    const decoder = new TextDecoder();
    return data.map((v) => JSON.parse(decoder.decode(v)));
  }
  if (ctype === "BSON") {
    throw new Error("parquet bson not supported");
  }
  if (ctype === "INTERVAL") {
    throw new Error("parquet interval not supported");
  }
  if (ctype === "UTF8" || ltype?.type === "STRING" || utf8 && type === "BYTE_ARRAY") {
    const decoder = new TextDecoder();
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = data[i] && decoder.decode(data[i]);
    }
    return arr;
  }
  if (ctype === "UINT_64" || ltype?.type === "INTEGER" && ltype.bitWidth === 64 && !ltype.isSigned) {
    if (data instanceof BigInt64Array) {
      return new BigUint64Array(data.buffer, data.byteOffset, data.length);
    }
    const arr = new BigUint64Array(data.length);
    for (let i = 0; i < arr.length; i++) arr[i] = BigInt(data[i]);
    return arr;
  }
  if (ctype === "UINT_32" || ltype?.type === "INTEGER" && ltype.bitWidth === 32 && !ltype.isSigned) {
    if (data instanceof Int32Array) {
      return new Uint32Array(data.buffer, data.byteOffset, data.length);
    }
    const arr = new Uint32Array(data.length);
    for (let i = 0; i < arr.length; i++) arr[i] = data[i];
    return arr;
  }
  if (ltype?.type === "FLOAT16") {
    return Array.from(data).map(parseFloat16);
  }
  if (ltype?.type === "TIMESTAMP") {
    const { unit } = ltype;
    let factor = 1n;
    if (unit === "MICROS") factor = 1000n;
    if (unit === "NANOS") factor = 1000000n;
    const arr = new Array(data.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = new Date(Number(data[i] / factor));
    }
    return arr;
  }
  return data;
}
function parseDecimal(bytes) {
  let value = 0;
  for (const byte of bytes) {
    value = value * 256 + byte;
  }
  const bits = bytes.length * 8;
  if (value >= 2 ** (bits - 1)) {
    value -= 2 ** bits;
  }
  return value;
}
function parseInt96Date(value) {
  const days = Number((value >> 64n) - 2440588n);
  const nano = Number((value & 0xffffffffffffffffn) / 1000000n);
  const millis = days * dayMillis + nano;
  return new Date(millis);
}
function parseFloat16(bytes) {
  if (!bytes) return void 0;
  const int16 = bytes[1] << 8 | bytes[0];
  const sign = int16 >> 15 ? -1 : 1;
  const exp = int16 >> 10 & 31;
  const frac = int16 & 1023;
  if (exp === 0) return sign * 2 ** -14 * (frac / 1024);
  if (exp === 31) return frac ? NaN : sign * Infinity;
  return sign * 2 ** (exp - 15) * (1 + frac / 1024);
}

// src/schema.js
function schemaTree(schema, rootIndex, path) {
  const element = schema[rootIndex];
  const children = [];
  let count = 1;
  if (element.num_children) {
    while (children.length < element.num_children) {
      const childElement = schema[rootIndex + count];
      const child = schemaTree(schema, rootIndex + count, [...path, childElement.name]);
      count += child.count;
      children.push(child);
    }
  }
  return { count, element, children, path };
}
function getSchemaPath(schema, name) {
  let tree = schemaTree(schema, 0, []);
  const path = [tree];
  for (const part of name) {
    const child = tree.children.find((child2) => child2.element.name === part);
    if (!child) throw new Error(`parquet schema element not found: ${name}`);
    path.push(child);
    tree = child;
  }
  return path;
}
function getMaxRepetitionLevel(schemaPath) {
  let maxLevel = 0;
  for (const { element } of schemaPath) {
    if (element.repetition_type === "REPEATED") {
      maxLevel++;
    }
  }
  return maxLevel;
}
function getMaxDefinitionLevel(schemaPath) {
  let maxLevel = 0;
  for (const { element } of schemaPath.slice(1)) {
    if (element.repetition_type !== "REQUIRED") {
      maxLevel++;
    }
  }
  return maxLevel;
}
function isListLike(schema) {
  if (!schema) return false;
  if (schema.element.converted_type !== "LIST") return false;
  if (schema.children.length > 1) return false;
  const firstChild = schema.children[0];
  if (firstChild.children.length > 1) return false;
  if (firstChild.element.repetition_type !== "REPEATED") return false;
  return true;
}
function isMapLike(schema) {
  if (!schema) return false;
  if (schema.element.converted_type !== "MAP") return false;
  if (schema.children.length > 1) return false;
  const firstChild = schema.children[0];
  if (firstChild.children.length !== 2) return false;
  if (firstChild.element.repetition_type !== "REPEATED") return false;
  const keyChild = firstChild.children.find((child) => child.element.name === "key");
  if (keyChild?.element.repetition_type === "REPEATED") return false;
  const valueChild = firstChild.children.find((child) => child.element.name === "value");
  if (valueChild?.element.repetition_type === "REPEATED") return false;
  return true;
}
function isFlatColumn(schemaPath) {
  if (schemaPath.length !== 2) return false;
  const [, column] = schemaPath;
  if (column.element.repetition_type === "REPEATED") return false;
  if (column.children.length) return false;
  return true;
}

// src/thrift.js
var CompactType = {
  STOP: 0,
  TRUE: 1,
  FALSE: 2,
  BYTE: 3,
  I16: 4,
  I32: 5,
  I64: 6,
  DOUBLE: 7,
  BINARY: 8,
  LIST: 9,
  SET: 10,
  MAP: 11,
  STRUCT: 12,
  UUID: 13
};
function deserializeTCompactProtocol(reader) {
  let lastFid = 0;
  const value = {};
  while (reader.offset < reader.view.byteLength) {
    const [type, fid, newLastFid] = readFieldBegin(reader, lastFid);
    lastFid = newLastFid;
    if (type === CompactType.STOP) {
      break;
    }
    value[`field_${fid}`] = readElement(reader, type);
  }
  return value;
}
function readElement(reader, type) {
  switch (type) {
    case CompactType.TRUE:
      return true;
    case CompactType.FALSE:
      return false;
    case CompactType.BYTE:
      return reader.view.getInt8(reader.offset++);
    case CompactType.I16:
    case CompactType.I32:
      return readZigZag(reader);
    case CompactType.I64:
      return readZigZagBigInt(reader);
    case CompactType.DOUBLE: {
      const value = reader.view.getFloat64(reader.offset, true);
      reader.offset += 8;
      return value;
    }
    case CompactType.BINARY: {
      const stringLength = readVarInt(reader);
      const strBytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, stringLength);
      reader.offset += stringLength;
      return strBytes;
    }
    case CompactType.LIST: {
      const [elemType, listSize] = readCollectionBegin(reader);
      const boolType = elemType === CompactType.TRUE || elemType === CompactType.FALSE;
      const values = new Array(listSize);
      for (let i = 0; i < listSize; i++) {
        values[i] = boolType ? readElement(reader, CompactType.BYTE) === 1 : readElement(reader, elemType);
      }
      return values;
    }
    case CompactType.STRUCT: {
      const structValues = {};
      let structLastFid = 0;
      while (true) {
        let structFieldType, structFid;
        [structFieldType, structFid, structLastFid] = readFieldBegin(reader, structLastFid);
        if (structFieldType === CompactType.STOP) {
          break;
        }
        structValues[`field_${structFid}`] = readElement(reader, structFieldType);
      }
      return structValues;
    }
    // TODO: MAP, SET, UUID
    default:
      throw new Error(`thrift unhandled type: ${type}`);
  }
}
function readVarInt(reader) {
  let result = 0;
  let shift = 0;
  while (true) {
    const byte = reader.view.getUint8(reader.offset++);
    result |= (byte & 127) << shift;
    if (!(byte & 128)) {
      return result;
    }
    shift += 7;
  }
}
function readVarBigInt(reader) {
  let result = 0n;
  let shift = 0n;
  while (true) {
    const byte = reader.view.getUint8(reader.offset++);
    result |= BigInt(byte & 127) << shift;
    if (!(byte & 128)) {
      return result;
    }
    shift += 7n;
  }
}
function readZigZag(reader) {
  const zigzag = readVarInt(reader);
  return zigzag >>> 1 ^ -(zigzag & 1);
}
function readZigZagBigInt(reader) {
  const zigzag = readVarBigInt(reader);
  return zigzag >> 1n ^ -(zigzag & 1n);
}
function getCompactType(byte) {
  return byte & 15;
}
function readFieldBegin(reader, lastFid) {
  const type = reader.view.getUint8(reader.offset++);
  if ((type & 15) === CompactType.STOP) {
    return [0, 0, lastFid];
  }
  const delta = type >> 4;
  let fid;
  if (delta) {
    fid = lastFid + delta;
  } else {
    throw new Error("non-delta field id not supported");
  }
  return [getCompactType(type), fid, fid];
}
function readCollectionBegin(reader) {
  const sizeType = reader.view.getUint8(reader.offset++);
  const size = sizeType >> 4;
  const type = getCompactType(sizeType);
  if (size === 15) {
    const newSize = readVarInt(reader);
    return [type, newSize];
  }
  return [type, size];
}

// src/metadata.js
var defaultInitialFetchSize = 1 << 19;
async function parquetMetadataAsync(asyncBuffer, initialFetchSize = defaultInitialFetchSize) {
  if (!asyncBuffer || !(asyncBuffer.byteLength >= 0)) throw new Error("parquet expected AsyncBuffer");
  const footerOffset = Math.max(0, asyncBuffer.byteLength - initialFetchSize);
  const footerBuffer = await asyncBuffer.slice(footerOffset, asyncBuffer.byteLength);
  const footerView = new DataView(footerBuffer);
  if (footerView.getUint32(footerBuffer.byteLength - 4, true) !== 827474256) {
    throw new Error("parquet file invalid (footer != PAR1)");
  }
  const metadataLength = footerView.getUint32(footerBuffer.byteLength - 8, true);
  if (metadataLength > asyncBuffer.byteLength - 8) {
    throw new Error(`parquet metadata length ${metadataLength} exceeds available buffer ${asyncBuffer.byteLength - 8}`);
  }
  if (metadataLength + 8 > initialFetchSize) {
    const metadataOffset = asyncBuffer.byteLength - metadataLength - 8;
    const metadataBuffer = await asyncBuffer.slice(metadataOffset, footerOffset);
    const combinedBuffer = new ArrayBuffer(metadataLength + 8);
    const combinedView = new Uint8Array(combinedBuffer);
    combinedView.set(new Uint8Array(metadataBuffer));
    combinedView.set(new Uint8Array(footerBuffer), footerOffset - metadataOffset);
    return parquetMetadata(combinedBuffer);
  } else {
    return parquetMetadata(footerBuffer);
  }
}
function parquetMetadata(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer)) throw new Error("parquet expected ArrayBuffer");
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 8) {
    throw new Error("parquet file is too short");
  }
  if (view.getUint32(view.byteLength - 4, true) !== 827474256) {
    throw new Error("parquet file invalid (footer != PAR1)");
  }
  const metadataLengthOffset = view.byteLength - 8;
  const metadataLength = view.getUint32(metadataLengthOffset, true);
  if (metadataLength > view.byteLength - 8) {
    throw new Error(`parquet metadata length ${metadataLength} exceeds available buffer ${view.byteLength - 8}`);
  }
  const metadataOffset = metadataLengthOffset - metadataLength;
  const reader = { view, offset: metadataOffset };
  const metadata = deserializeTCompactProtocol(reader);
  const decoder = new TextDecoder();
  function decode(value) {
    return value && decoder.decode(value);
  }
  const version = metadata.field_1;
  const schema = metadata.field_2.map((field) => ({
    type: ParquetType[field.field_1],
    type_length: field.field_2,
    repetition_type: FieldRepetitionType[field.field_3],
    name: decode(field.field_4),
    num_children: field.field_5,
    converted_type: ConvertedType[field.field_6],
    scale: field.field_7,
    precision: field.field_8,
    field_id: field.field_9,
    logical_type: logicalType(field.field_10)
  }));
  const columnSchema = schema.filter((e) => e.type);
  const num_rows = metadata.field_3;
  const row_groups = metadata.field_4.map((rowGroup) => ({
    columns: rowGroup.field_1.map((column, columnIndex) => ({
      file_path: decode(column.field_1),
      file_offset: column.field_2,
      meta_data: column.field_3 && {
        type: ParquetType[column.field_3.field_1],
        encodings: column.field_3.field_2?.map((e) => Encoding[e]),
        path_in_schema: column.field_3.field_3.map(decode),
        codec: CompressionCodec[column.field_3.field_4],
        num_values: column.field_3.field_5,
        total_uncompressed_size: column.field_3.field_6,
        total_compressed_size: column.field_3.field_7,
        key_value_metadata: column.field_3.field_8,
        data_page_offset: column.field_3.field_9,
        index_page_offset: column.field_3.field_10,
        dictionary_page_offset: column.field_3.field_11,
        statistics: convertStats(column.field_3.field_12, columnSchema[columnIndex]),
        encoding_stats: column.field_3.field_13?.map((encodingStat) => ({
          page_type: PageType[encodingStat.field_1],
          encoding: Encoding[encodingStat.field_2],
          count: encodingStat.field_3
        })),
        bloom_filter_offset: column.field_3.field_14,
        bloom_filter_length: column.field_3.field_15,
        size_statistics: column.field_3.field_16 && {
          unencoded_byte_array_data_bytes: column.field_3.field_16.field_1,
          repetition_level_histogram: column.field_3.field_16.field_2,
          definition_level_histogram: column.field_3.field_16.field_3
        }
      },
      offset_index_offset: column.field_4,
      offset_index_length: column.field_5,
      column_index_offset: column.field_6,
      column_index_length: column.field_7,
      crypto_metadata: column.field_8,
      encrypted_column_metadata: column.field_9
    })),
    total_byte_size: rowGroup.field_2,
    num_rows: rowGroup.field_3,
    sorting_columns: rowGroup.field_4?.map((sortingColumn) => ({
      column_idx: sortingColumn.field_1,
      descending: sortingColumn.field_2,
      nulls_first: sortingColumn.field_3
    })),
    file_offset: rowGroup.field_5,
    total_compressed_size: rowGroup.field_6,
    ordinal: rowGroup.field_7
  }));
  const key_value_metadata = metadata.field_5?.map((keyValue) => ({
    key: decode(keyValue.field_1),
    value: decode(keyValue.field_2)
  }));
  const created_by = decode(metadata.field_6);
  return {
    version,
    schema,
    num_rows,
    row_groups,
    key_value_metadata,
    created_by,
    metadata_length: metadataLength
  };
}
function parquetSchema({ schema }) {
  return getSchemaPath(schema, [])[0];
}
function logicalType(logicalType2) {
  if (logicalType2?.field_1) return { type: "STRING" };
  if (logicalType2?.field_2) return { type: "MAP" };
  if (logicalType2?.field_3) return { type: "LIST" };
  if (logicalType2?.field_4) return { type: "ENUM" };
  if (logicalType2?.field_5) return {
    type: "DECIMAL",
    scale: logicalType2.field_5.field_1,
    precision: logicalType2.field_5.field_2
  };
  if (logicalType2?.field_6) return { type: "DATE" };
  if (logicalType2?.field_7) return {
    type: "TIME",
    isAdjustedToUTC: logicalType2.field_7.field_1,
    unit: timeUnit(logicalType2.field_7.field_2)
  };
  if (logicalType2?.field_8) return {
    type: "TIMESTAMP",
    isAdjustedToUTC: logicalType2.field_8.field_1,
    unit: timeUnit(logicalType2.field_8.field_2)
  };
  if (logicalType2?.field_10) return {
    type: "INTEGER",
    bitWidth: logicalType2.field_10.field_1,
    isSigned: logicalType2.field_10.field_2
  };
  if (logicalType2?.field_11) return { type: "NULL" };
  if (logicalType2?.field_12) return { type: "JSON" };
  if (logicalType2?.field_13) return { type: "BSON" };
  if (logicalType2?.field_14) return { type: "UUID" };
  if (logicalType2?.field_15) return { type: "FLOAT16" };
  return logicalType2;
}
function timeUnit(unit) {
  if (unit.field_1) return "MILLIS";
  if (unit.field_2) return "MICROS";
  if (unit.field_3) return "NANOS";
  throw new Error("parquet time unit required");
}
function convertStats(stats, schema) {
  return stats && {
    max: convertMetadata(stats.field_1, schema),
    min: convertMetadata(stats.field_2, schema),
    null_count: stats.field_3,
    distinct_count: stats.field_4,
    max_value: convertMetadata(stats.field_5, schema),
    min_value: convertMetadata(stats.field_6, schema),
    is_max_value_exact: stats.field_7,
    is_min_value_exact: stats.field_8
  };
}
function convertMetadata(value, schema) {
  const { type, converted_type, logical_type } = schema;
  if (value === void 0) return value;
  if (type === "BOOLEAN") return value[0] === 1;
  if (type === "BYTE_ARRAY") return new TextDecoder().decode(value);
  const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
  if (type === "FLOAT" && view.byteLength === 4) return view.getFloat32(0, true);
  if (type === "DOUBLE" && view.byteLength === 8) return view.getFloat64(0, true);
  if (type === "INT32" && converted_type === "DATE") return new Date(view.getInt32(0, true) * 864e5);
  if (type === "INT64" && converted_type === "TIMESTAMP_MICROS") return new Date(Number(view.getBigInt64(0, true) / 1000n));
  if (type === "INT64" && converted_type === "TIMESTAMP_MILLIS") return new Date(Number(view.getBigInt64(0, true)));
  if (type === "INT64" && logical_type?.type === "TIMESTAMP" && logical_type?.unit === "NANOS") return new Date(Number(view.getBigInt64(0, true) / 1000000n));
  if (type === "INT64" && logical_type?.type === "TIMESTAMP" && logical_type?.unit === "MICROS") return new Date(Number(view.getBigInt64(0, true) / 1000n));
  if (type === "INT64" && logical_type?.type === "TIMESTAMP") return new Date(Number(view.getBigInt64(0, true)));
  if (type === "INT32" && view.byteLength === 4) return view.getInt32(0, true);
  if (type === "INT64" && view.byteLength === 8) return view.getBigInt64(0, true);
  if (converted_type === "DECIMAL") return parseDecimal(value) * 10 ** -(schema.scale || 0);
  if (logical_type?.type === "FLOAT16") return parseFloat16(value);
  if (type === "FIXED_LEN_BYTE_ARRAY") return value;
  return value;
}

// src/utils.js
function toJson(obj) {
  if (obj === void 0) return null;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(toJson);
  if (obj instanceof Uint8Array) return Array.from(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Object) {
    const newObj = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] === void 0) continue;
      newObj[key] = toJson(obj[key]);
    }
    return newObj;
  }
  return obj;
}
function concat(aaa, bbb) {
  const chunk = 1e4;
  for (let i = 0; i < bbb.length; i += chunk) {
    aaa.push(...bbb.slice(i, i + chunk));
  }
}
function equals(a, b) {
  if (a === b) return true;
  if (a instanceof Uint8Array && b instanceof Uint8Array) return equals(Array.from(a), Array.from(b));
  if (!a || !b || typeof a !== typeof b) return false;
  return Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((v, i) => equals(v, b[i])) : typeof a === "object" && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => equals(a[k], b[k]));
}
async function byteLengthFromUrl(url, requestInit, customFetch) {
  const fetch = customFetch ?? globalThis.fetch;
  return await fetch(url, { ...requestInit, method: "HEAD" }).then((res) => {
    if (!res.ok) throw new Error(`fetch head failed ${res.status}`);
    const length = res.headers.get("Content-Length");
    if (!length) throw new Error("missing content length");
    return parseInt(length);
  });
}
async function asyncBufferFromUrl({ url, byteLength, requestInit, fetch: customFetch }) {
  if (!url) throw new Error("missing url");
  const fetch = customFetch ?? globalThis.fetch;
  byteLength ||= await byteLengthFromUrl(url, requestInit, fetch);
  let buffer = void 0;
  const init = requestInit || {};
  return {
    byteLength,
    async slice(start, end) {
      if (buffer) {
        return buffer.then((buffer2) => buffer2.slice(start, end));
      }
      const headers = new Headers(init.headers);
      const endStr = end === void 0 ? "" : end - 1;
      headers.set("Range", `bytes=${start}-${endStr}`);
      const res = await fetch(url, { ...init, headers });
      if (!res.ok || !res.body) throw new Error(`fetch failed ${res.status}`);
      if (res.status === 200) {
        buffer = res.arrayBuffer();
        return buffer.then((buffer2) => buffer2.slice(start, end));
      } else if (res.status === 206) {
        return res.arrayBuffer();
      } else {
        throw new Error(`fetch received unexpected status code ${res.status}`);
      }
    }
  };
}
async function asyncBufferFromFile(filename) {
  const fsPackage = "fs";
  const fs = await import(fsPackage);
  const stat = await fs.promises.stat(filename);
  return {
    byteLength: stat.size,
    async slice(start, end) {
      const readStream = fs.createReadStream(filename, { start, end });
      return await readStreamToArrayBuffer(readStream);
    }
  };
}
function readStreamToArrayBuffer(input) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    input.on("data", (chunk) => chunks.push(chunk));
    input.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    });
    input.on("error", reject);
  });
}
function cachedAsyncBuffer({ byteLength, slice }, { minSize = defaultInitialFetchSize } = {}) {
  if (byteLength < minSize) {
    const buffer = slice(0, byteLength);
    return {
      byteLength,
      async slice(start, end) {
        return (await buffer).slice(start, end);
      }
    };
  }
  const cache = /* @__PURE__ */ new Map();
  return {
    byteLength,
    /**
     * @param {number} start
     * @param {number} [end]
     * @returns {Awaitable<ArrayBuffer>}
     */
    slice(start, end) {
      const key = cacheKey(start, end, byteLength);
      const cached = cache.get(key);
      if (cached) return cached;
      const promise = slice(start, end);
      cache.set(key, promise);
      return promise;
    }
  };
}
function cacheKey(start, end, size) {
  if (start < 0) {
    if (end !== void 0) throw new Error(`invalid suffix range [${start}, ${end}]`);
    if (size === void 0) return `${start},`;
    return `${size + start},${size}`;
  } else if (end !== void 0) {
    if (start > end) throw new Error(`invalid empty range [${start}, ${end}]`);
    return `${start},${end}`;
  } else if (size === void 0) {
    return `${start},`;
  } else {
    return `${start},${size}`;
  }
}
function flatten(chunks) {
  if (!chunks) return [];
  if (chunks.length === 1) return chunks[0];
  const output = [];
  for (const chunk of chunks) {
    concat(output, chunk);
  }
  return output;
}

// src/plan.js
var columnChunkAggregation = 1 << 25;
function parquetPlan({ metadata, rowStart = 0, rowEnd = Infinity, columns }) {
  if (!metadata) throw new Error("parquetPlan requires metadata");
  const groups = [];
  const fetches = [];
  let groupStart = 0;
  for (const rowGroup of metadata.row_groups) {
    const groupRows = Number(rowGroup.num_rows);
    const groupEnd = groupStart + groupRows;
    if (groupEnd >= rowStart && groupStart < rowEnd) {
      const ranges = [];
      for (const { file_path, meta_data } of rowGroup.columns) {
        if (file_path) throw new Error("parquet file_path not supported");
        if (!meta_data) throw new Error("parquet column metadata is undefined");
        if (!columns || columns.includes(meta_data.path_in_schema[0])) {
          ranges.push(getColumnRange(meta_data));
        }
      }
      const selectStart = Math.max(rowStart - groupStart, 0);
      const selectEnd = Math.min(rowEnd - groupStart, groupRows);
      groups.push({ ranges, rowGroup, groupStart, groupRows, selectStart, selectEnd });
      const groupSize = ranges[ranges.length - 1]?.endByte - ranges[0]?.startByte;
      if (!columns && groupSize < columnChunkAggregation) {
        fetches.push({
          startByte: ranges[0].startByte,
          endByte: ranges[ranges.length - 1].endByte
        });
      } else if (ranges.length) {
        concat(fetches, ranges);
      } else if (columns?.length) {
        throw new Error(`parquet columns not found: ${columns.join(", ")}`);
      }
    }
    groupStart = groupEnd;
  }
  if (!isFinite(rowEnd)) rowEnd = groupStart;
  return { metadata, rowStart, rowEnd, columns, fetches, groups };
}
function getColumnRange({ dictionary_page_offset, data_page_offset, total_compressed_size }) {
  const columnOffset = dictionary_page_offset || data_page_offset;
  return {
    startByte: Number(columnOffset),
    endByte: Number(columnOffset + total_compressed_size)
  };
}
function prefetchAsyncBuffer(file, { fetches }) {
  const promises = fetches.map(({ startByte, endByte }) => file.slice(startByte, endByte));
  return {
    byteLength: file.byteLength,
    slice(start, end = file.byteLength) {
      const index = fetches.findIndex(({ startByte, endByte }) => startByte <= start && end <= endByte);
      if (index < 0) throw new Error(`no prefetch for range [${start}, ${end}]`);
      if (fetches[index].startByte !== start || fetches[index].endByte !== end) {
        const startOffset = start - fetches[index].startByte;
        const endOffset = end - fetches[index].startByte;
        if (promises[index] instanceof Promise) {
          return promises[index].then((buffer) => buffer.slice(startOffset, endOffset));
        } else {
          return promises[index].slice(startOffset, endOffset);
        }
      } else {
        return promises[index];
      }
    }
  };
}

// src/assemble.js
function assembleLists(output, definitionLevels, repetitionLevels, values, schemaPath) {
  const n = definitionLevels?.length || repetitionLevels.length;
  if (!n) return values;
  const maxDefinitionLevel = getMaxDefinitionLevel(schemaPath);
  const repetitionPath = schemaPath.map(({ element }) => element.repetition_type);
  let valueIndex = 0;
  const containerStack = [output];
  let currentContainer = output;
  let currentDepth = 0;
  let currentDefLevel = 0;
  let currentRepLevel = 0;
  if (repetitionLevels[0]) {
    while (currentDepth < repetitionPath.length - 2 && currentRepLevel < repetitionLevels[0]) {
      currentDepth++;
      if (repetitionPath[currentDepth] !== "REQUIRED") {
        currentContainer = currentContainer.at(-1);
        containerStack.push(currentContainer);
        currentDefLevel++;
      }
      if (repetitionPath[currentDepth] === "REPEATED") currentRepLevel++;
    }
  }
  for (let i = 0; i < n; i++) {
    const def = definitionLevels?.length ? definitionLevels[i] : maxDefinitionLevel;
    const rep = repetitionLevels[i];
    while (currentDepth && (rep < currentRepLevel || repetitionPath[currentDepth] !== "REPEATED")) {
      if (repetitionPath[currentDepth] !== "REQUIRED") {
        containerStack.pop();
        currentDefLevel--;
      }
      if (repetitionPath[currentDepth] === "REPEATED") currentRepLevel--;
      currentDepth--;
    }
    currentContainer = containerStack.at(-1);
    while ((currentDepth < repetitionPath.length - 2 || repetitionPath[currentDepth + 1] === "REPEATED") && (currentDefLevel < def || repetitionPath[currentDepth + 1] === "REQUIRED")) {
      currentDepth++;
      if (repetitionPath[currentDepth] !== "REQUIRED") {
        const newList = [];
        currentContainer.push(newList);
        currentContainer = newList;
        containerStack.push(newList);
        currentDefLevel++;
      }
      if (repetitionPath[currentDepth] === "REPEATED") currentRepLevel++;
    }
    if (def === maxDefinitionLevel) {
      currentContainer.push(values[valueIndex++]);
    } else if (currentDepth === repetitionPath.length - 2) {
      currentContainer.push(null);
    } else {
      currentContainer.push([]);
    }
  }
  if (!output.length) {
    for (let i = 0; i < maxDefinitionLevel; i++) {
      const newList = [];
      currentContainer.push(newList);
      currentContainer = newList;
    }
  }
  return output;
}
function assembleNested(subcolumnData, schema, depth = 0) {
  const path = schema.path.join(".");
  const optional = schema.element.repetition_type === "OPTIONAL";
  const nextDepth = optional ? depth + 1 : depth;
  if (isListLike(schema)) {
    let sublist = schema.children[0];
    let subDepth = nextDepth;
    if (sublist.children.length === 1) {
      sublist = sublist.children[0];
      subDepth++;
    }
    assembleNested(subcolumnData, sublist, subDepth);
    const subcolumn = sublist.path.join(".");
    const values = subcolumnData.get(subcolumn);
    if (!values) throw new Error("parquet list column missing values");
    if (optional) flattenAtDepth(values, depth);
    subcolumnData.set(path, values);
    subcolumnData.delete(subcolumn);
    return;
  }
  if (isMapLike(schema)) {
    const mapName = schema.children[0].element.name;
    assembleNested(subcolumnData, schema.children[0].children[0], nextDepth + 1);
    assembleNested(subcolumnData, schema.children[0].children[1], nextDepth + 1);
    const keys = subcolumnData.get(`${path}.${mapName}.key`);
    const values = subcolumnData.get(`${path}.${mapName}.value`);
    if (!keys) throw new Error("parquet map column missing keys");
    if (!values) throw new Error("parquet map column missing values");
    if (keys.length !== values.length) {
      throw new Error("parquet map column key/value length mismatch");
    }
    const out = assembleMaps(keys, values, nextDepth);
    if (optional) flattenAtDepth(out, depth);
    subcolumnData.delete(`${path}.${mapName}.key`);
    subcolumnData.delete(`${path}.${mapName}.value`);
    subcolumnData.set(path, out);
    return;
  }
  if (schema.children.length) {
    const invertDepth = schema.element.repetition_type === "REQUIRED" ? depth : depth + 1;
    const struct = {};
    for (const child of schema.children) {
      assembleNested(subcolumnData, child, invertDepth);
      const childData = subcolumnData.get(child.path.join("."));
      if (!childData) throw new Error("parquet struct missing child data");
      struct[child.element.name] = childData;
    }
    for (const child of schema.children) {
      subcolumnData.delete(child.path.join("."));
    }
    const inverted = invertStruct(struct, invertDepth);
    if (optional) flattenAtDepth(inverted, depth);
    subcolumnData.set(path, inverted);
  }
}
function flattenAtDepth(arr, depth) {
  for (let i = 0; i < arr.length; i++) {
    if (depth) {
      flattenAtDepth(arr[i], depth - 1);
    } else {
      arr[i] = arr[i][0];
    }
  }
}
function assembleMaps(keys, values, depth) {
  const out = [];
  for (let i = 0; i < keys.length; i++) {
    if (depth) {
      out.push(assembleMaps(keys[i], values[i], depth - 1));
    } else {
      if (keys[i]) {
        const obj = {};
        for (let j = 0; j < keys[i].length; j++) {
          const value = values[i][j];
          obj[keys[i][j]] = value === void 0 ? null : value;
        }
        out.push(obj);
      } else {
        out.push(void 0);
      }
    }
  }
  return out;
}
function invertStruct(struct, depth) {
  const keys = Object.keys(struct);
  const length = struct[keys[0]]?.length;
  const out = [];
  for (let i = 0; i < length; i++) {
    const obj = {};
    for (const key of keys) {
      if (struct[key].length !== length) throw new Error("parquet struct parsing error");
      obj[key] = struct[key][i];
    }
    if (depth) {
      out.push(invertStruct(obj, depth - 1));
    } else {
      out.push(obj);
    }
  }
  return out;
}

// src/delta.js
function deltaBinaryUnpack(reader, count, output) {
  const int32 = output instanceof Int32Array;
  const blockSize = readVarInt(reader);
  const miniblockPerBlock = readVarInt(reader);
  readVarInt(reader);
  let value = readZigZagBigInt(reader);
  let outputIndex = 0;
  output[outputIndex++] = int32 ? Number(value) : value;
  const valuesPerMiniblock = blockSize / miniblockPerBlock;
  while (outputIndex < count) {
    const minDelta = readZigZagBigInt(reader);
    const bitWidths = new Uint8Array(miniblockPerBlock);
    for (let i = 0; i < miniblockPerBlock; i++) {
      bitWidths[i] = reader.view.getUint8(reader.offset++);
    }
    for (let i = 0; i < miniblockPerBlock && outputIndex < count; i++) {
      const bitWidth2 = BigInt(bitWidths[i]);
      if (bitWidth2) {
        let bitpackPos = 0n;
        let miniblockCount = valuesPerMiniblock;
        const mask = (1n << bitWidth2) - 1n;
        while (miniblockCount && outputIndex < count) {
          let bits = BigInt(reader.view.getUint8(reader.offset)) >> bitpackPos & mask;
          bitpackPos += bitWidth2;
          while (bitpackPos >= 8) {
            bitpackPos -= 8n;
            reader.offset++;
            if (bitpackPos) {
              bits |= BigInt(reader.view.getUint8(reader.offset)) << bitWidth2 - bitpackPos & mask;
            }
          }
          const delta = minDelta + bits;
          value += delta;
          output[outputIndex++] = int32 ? Number(value) : value;
          miniblockCount--;
        }
        if (miniblockCount) {
          reader.offset += Math.ceil((miniblockCount * Number(bitWidth2) + Number(bitpackPos)) / 8);
        }
      } else {
        for (let j = 0; j < valuesPerMiniblock && outputIndex < count; j++) {
          value += minDelta;
          output[outputIndex++] = int32 ? Number(value) : value;
        }
      }
    }
  }
}
function deltaLengthByteArray(reader, count, output) {
  const lengths = new Int32Array(count);
  deltaBinaryUnpack(reader, count, lengths);
  for (let i = 0; i < count; i++) {
    output[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, lengths[i]);
    reader.offset += lengths[i];
  }
}
function deltaByteArray(reader, count, output) {
  const prefixData = new Int32Array(count);
  deltaBinaryUnpack(reader, count, prefixData);
  const suffixData = new Int32Array(count);
  deltaBinaryUnpack(reader, count, suffixData);
  for (let i = 0; i < count; i++) {
    const suffix = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, suffixData[i]);
    if (prefixData[i]) {
      output[i] = new Uint8Array(prefixData[i] + suffixData[i]);
      output[i].set(output[i - 1].subarray(0, prefixData[i]));
      output[i].set(suffix, prefixData[i]);
    } else {
      output[i] = suffix;
    }
    reader.offset += suffixData[i];
  }
}

// src/encoding.js
function bitWidth(value) {
  return 32 - Math.clz32(value);
}
function readRleBitPackedHybrid(reader, width, length, output) {
  if (!length) {
    reader.offset += 4;
  }
  let seen = 0;
  while (seen < output.length) {
    const header = readVarInt(reader);
    if (header & 1) {
      seen = readBitPacked(reader, header, width, output, seen);
    } else {
      const count = header >>> 1;
      readRle(reader, count, width, output, seen);
      seen += count;
    }
  }
}
function readRle(reader, count, bitWidth2, output, seen) {
  const width = bitWidth2 + 7 >> 3;
  let value = 0;
  for (let i = 0; i < width; i++) {
    value |= reader.view.getUint8(reader.offset++) << (i << 3);
  }
  for (let i = 0; i < count; i++) {
    output[seen + i] = value;
  }
}
function readBitPacked(reader, header, bitWidth2, output, seen) {
  let count = header >> 1 << 3;
  const mask = (1 << bitWidth2) - 1;
  let data = 0;
  if (reader.offset < reader.view.byteLength) {
    data = reader.view.getUint8(reader.offset++);
  } else if (mask) {
    throw new Error(`parquet bitpack offset ${reader.offset} out of range`);
  }
  let left = 8;
  let right = 0;
  while (count) {
    if (right > 8) {
      right -= 8;
      left -= 8;
      data >>>= 8;
    } else if (left - right < bitWidth2) {
      data |= reader.view.getUint8(reader.offset) << left;
      reader.offset++;
      left += 8;
    } else {
      if (seen < output.length) {
        output[seen++] = data >> right & mask;
      }
      count--;
      right += bitWidth2;
    }
  }
  return seen;
}
function byteStreamSplit(reader, count, type, typeLength) {
  const width = byteWidth(type, typeLength);
  const bytes = new Uint8Array(count * width);
  for (let b = 0; b < width; b++) {
    for (let i = 0; i < count; i++) {
      bytes[i * width + b] = reader.view.getUint8(reader.offset++);
    }
  }
  if (type === "FLOAT") return new Float32Array(bytes.buffer);
  else if (type === "DOUBLE") return new Float64Array(bytes.buffer);
  else if (type === "INT32") return new Int32Array(bytes.buffer);
  else if (type === "INT64") return new BigInt64Array(bytes.buffer);
  else if (type === "FIXED_LEN_BYTE_ARRAY") {
    const split = new Array(count);
    for (let i = 0; i < count; i++) {
      split[i] = bytes.subarray(i * width, (i + 1) * width);
    }
    return split;
  }
  throw new Error(`parquet byte_stream_split unsupported type: ${type}`);
}
function byteWidth(type, typeLength) {
  switch (type) {
    case "INT32":
    case "FLOAT":
      return 4;
    case "INT64":
    case "DOUBLE":
      return 8;
    case "FIXED_LEN_BYTE_ARRAY":
      if (!typeLength) throw new Error("parquet byteWidth missing type_length");
      return typeLength;
    default:
      throw new Error(`parquet unsupported type: ${type}`);
  }
}

// src/plain.js
function readPlain(reader, type, count, fixedLength) {
  if (count === 0) return [];
  if (type === "BOOLEAN") {
    return readPlainBoolean(reader, count);
  } else if (type === "INT32") {
    return readPlainInt32(reader, count);
  } else if (type === "INT64") {
    return readPlainInt64(reader, count);
  } else if (type === "INT96") {
    return readPlainInt96(reader, count);
  } else if (type === "FLOAT") {
    return readPlainFloat(reader, count);
  } else if (type === "DOUBLE") {
    return readPlainDouble(reader, count);
  } else if (type === "BYTE_ARRAY") {
    return readPlainByteArray(reader, count);
  } else if (type === "FIXED_LEN_BYTE_ARRAY") {
    if (!fixedLength) throw new Error("parquet missing fixed length");
    return readPlainByteArrayFixed(reader, count, fixedLength);
  } else {
    throw new Error(`parquet unhandled type: ${type}`);
  }
}
function readPlainBoolean(reader, count) {
  const values = new Array(count);
  for (let i = 0; i < count; i++) {
    const byteOffset = reader.offset + (i / 8 | 0);
    const bitOffset = i % 8;
    const byte = reader.view.getUint8(byteOffset);
    values[i] = (byte & 1 << bitOffset) !== 0;
  }
  reader.offset += Math.ceil(count / 8);
  return values;
}
function readPlainInt32(reader, count) {
  const values = (reader.view.byteOffset + reader.offset) % 4 ? new Int32Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 4)) : new Int32Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
  reader.offset += count * 4;
  return values;
}
function readPlainInt64(reader, count) {
  const values = (reader.view.byteOffset + reader.offset) % 8 ? new BigInt64Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 8)) : new BigInt64Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
  reader.offset += count * 8;
  return values;
}
function readPlainInt96(reader, count) {
  const values = new Array(count);
  for (let i = 0; i < count; i++) {
    const low = reader.view.getBigInt64(reader.offset + i * 12, true);
    const high = reader.view.getInt32(reader.offset + i * 12 + 8, true);
    values[i] = BigInt(high) << 64n | low;
  }
  reader.offset += count * 12;
  return values;
}
function readPlainFloat(reader, count) {
  const values = (reader.view.byteOffset + reader.offset) % 4 ? new Float32Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 4)) : new Float32Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
  reader.offset += count * 4;
  return values;
}
function readPlainDouble(reader, count) {
  const values = (reader.view.byteOffset + reader.offset) % 8 ? new Float64Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 8)) : new Float64Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
  reader.offset += count * 8;
  return values;
}
function readPlainByteArray(reader, count) {
  const values = new Array(count);
  for (let i = 0; i < count; i++) {
    const length = reader.view.getUint32(reader.offset, true);
    reader.offset += 4;
    values[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, length);
    reader.offset += length;
  }
  return values;
}
function readPlainByteArrayFixed(reader, count, fixedLength) {
  const values = new Array(count);
  for (let i = 0; i < count; i++) {
    values[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, fixedLength);
    reader.offset += fixedLength;
  }
  return values;
}
function align(buffer, offset, size) {
  const aligned = new ArrayBuffer(size);
  new Uint8Array(aligned).set(new Uint8Array(buffer, offset, size));
  return aligned;
}

// src/snappy.js
var WORD_MASK = [0, 255, 65535, 16777215, 4294967295];
function copyBytes(fromArray, fromPos, toArray, toPos, length) {
  for (let i = 0; i < length; i++) {
    toArray[toPos + i] = fromArray[fromPos + i];
  }
}
function snappyUncompress(input, output) {
  const inputLength = input.byteLength;
  const outputLength = output.byteLength;
  let pos = 0;
  let outPos = 0;
  while (pos < inputLength) {
    const c = input[pos];
    pos++;
    if (c < 128) {
      break;
    }
  }
  if (outputLength && pos >= inputLength) {
    throw new Error("invalid snappy length header");
  }
  while (pos < inputLength) {
    const c = input[pos];
    let len = 0;
    pos++;
    if (pos >= inputLength) {
      throw new Error("missing eof marker");
    }
    if ((c & 3) === 0) {
      let len2 = (c >>> 2) + 1;
      if (len2 > 60) {
        if (pos + 3 >= inputLength) {
          throw new Error("snappy error literal pos + 3 >= inputLength");
        }
        const lengthSize = len2 - 60;
        len2 = input[pos] + (input[pos + 1] << 8) + (input[pos + 2] << 16) + (input[pos + 3] << 24);
        len2 = (len2 & WORD_MASK[lengthSize]) + 1;
        pos += lengthSize;
      }
      if (pos + len2 > inputLength) {
        throw new Error("snappy error literal exceeds input length");
      }
      copyBytes(input, pos, output, outPos, len2);
      pos += len2;
      outPos += len2;
    } else {
      let offset = 0;
      switch (c & 3) {
        case 1:
          len = (c >>> 2 & 7) + 4;
          offset = input[pos] + (c >>> 5 << 8);
          pos++;
          break;
        case 2:
          if (inputLength <= pos + 1) {
            throw new Error("snappy error end of input");
          }
          len = (c >>> 2) + 1;
          offset = input[pos] + (input[pos + 1] << 8);
          pos += 2;
          break;
        case 3:
          if (inputLength <= pos + 3) {
            throw new Error("snappy error end of input");
          }
          len = (c >>> 2) + 1;
          offset = input[pos] + (input[pos + 1] << 8) + (input[pos + 2] << 16) + (input[pos + 3] << 24);
          pos += 4;
          break;
        default:
          break;
      }
      if (offset === 0 || isNaN(offset)) {
        throw new Error(`invalid offset ${offset} pos ${pos} inputLength ${inputLength}`);
      }
      if (offset > outPos) {
        throw new Error("cannot copy from before start of buffer");
      }
      copyBytes(output, outPos - offset, output, outPos, len);
      outPos += len;
    }
  }
  if (outPos !== outputLength) throw new Error("premature end of input");
}

// src/datapage.js
function readDataPage(bytes, daph, { type, element, schemaPath }) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const reader = { view, offset: 0 };
  let dataPage;
  const repetitionLevels = readRepetitionLevels(reader, daph, schemaPath);
  const { definitionLevels, numNulls } = readDefinitionLevels(reader, daph, schemaPath);
  const nValues = daph.num_values - numNulls;
  if (daph.encoding === "PLAIN") {
    dataPage = readPlain(reader, type, nValues, element.type_length);
  } else if (daph.encoding === "PLAIN_DICTIONARY" || daph.encoding === "RLE_DICTIONARY" || daph.encoding === "RLE") {
    const bitWidth2 = type === "BOOLEAN" ? 1 : view.getUint8(reader.offset++);
    if (bitWidth2) {
      dataPage = new Array(nValues);
      if (type === "BOOLEAN") {
        readRleBitPackedHybrid(reader, bitWidth2, 0, dataPage);
        dataPage = dataPage.map((x) => !!x);
      } else {
        readRleBitPackedHybrid(reader, bitWidth2, view.byteLength - reader.offset, dataPage);
      }
    } else {
      dataPage = new Uint8Array(nValues);
    }
  } else if (daph.encoding === "BYTE_STREAM_SPLIT") {
    dataPage = byteStreamSplit(reader, nValues, type, element.type_length);
  } else if (daph.encoding === "DELTA_BINARY_PACKED") {
    const int32 = type === "INT32";
    dataPage = int32 ? new Int32Array(nValues) : new BigInt64Array(nValues);
    deltaBinaryUnpack(reader, nValues, dataPage);
  } else if (daph.encoding === "DELTA_LENGTH_BYTE_ARRAY") {
    dataPage = new Array(nValues);
    deltaLengthByteArray(reader, nValues, dataPage);
  } else {
    throw new Error(`parquet unsupported encoding: ${daph.encoding}`);
  }
  return { definitionLevels, repetitionLevels, dataPage };
}
function readRepetitionLevels(reader, daph, schemaPath) {
  if (schemaPath.length > 1) {
    const maxRepetitionLevel = getMaxRepetitionLevel(schemaPath);
    if (maxRepetitionLevel) {
      const values = new Array(daph.num_values);
      readRleBitPackedHybrid(reader, bitWidth(maxRepetitionLevel), 0, values);
      return values;
    }
  }
  return [];
}
function readDefinitionLevels(reader, daph, schemaPath) {
  const maxDefinitionLevel = getMaxDefinitionLevel(schemaPath);
  if (!maxDefinitionLevel) return { definitionLevels: [], numNulls: 0 };
  const definitionLevels = new Array(daph.num_values);
  readRleBitPackedHybrid(reader, bitWidth(maxDefinitionLevel), 0, definitionLevels);
  let numNulls = daph.num_values;
  for (const def of definitionLevels) {
    if (def === maxDefinitionLevel) numNulls--;
  }
  if (numNulls === 0) definitionLevels.length = 0;
  return { definitionLevels, numNulls };
}
function decompressPage(compressedBytes, uncompressed_page_size, codec, compressors) {
  let page;
  const customDecompressor = compressors?.[codec];
  if (codec === "UNCOMPRESSED") {
    page = compressedBytes;
  } else if (customDecompressor) {
    page = customDecompressor(compressedBytes, uncompressed_page_size);
  } else if (codec === "SNAPPY") {
    page = new Uint8Array(uncompressed_page_size);
    snappyUncompress(compressedBytes, page);
  } else {
    throw new Error(`parquet unsupported compression codec: ${codec}`);
  }
  if (page?.length !== uncompressed_page_size) {
    throw new Error(`parquet decompressed page length ${page?.length} does not match header ${uncompressed_page_size}`);
  }
  return page;
}
function readDataPageV2(compressedBytes, ph, columnDecoder) {
  const view = new DataView(compressedBytes.buffer, compressedBytes.byteOffset, compressedBytes.byteLength);
  const reader = { view, offset: 0 };
  const { type, element, schemaPath, codec, compressors } = columnDecoder;
  const daph2 = ph.data_page_header_v2;
  if (!daph2) throw new Error("parquet data page header v2 is undefined");
  const repetitionLevels = readRepetitionLevelsV2(reader, daph2, schemaPath);
  reader.offset = daph2.repetition_levels_byte_length;
  const definitionLevels = readDefinitionLevelsV2(reader, daph2, schemaPath);
  const uncompressedPageSize = ph.uncompressed_page_size - daph2.definition_levels_byte_length - daph2.repetition_levels_byte_length;
  let page = compressedBytes.subarray(reader.offset);
  if (daph2.is_compressed !== false) {
    page = decompressPage(page, uncompressedPageSize, codec, compressors);
  }
  const pageView = new DataView(page.buffer, page.byteOffset, page.byteLength);
  const pageReader = { view: pageView, offset: 0 };
  let dataPage;
  const nValues = daph2.num_values - daph2.num_nulls;
  if (daph2.encoding === "PLAIN") {
    dataPage = readPlain(pageReader, type, nValues, element.type_length);
  } else if (daph2.encoding === "RLE") {
    dataPage = new Array(nValues);
    readRleBitPackedHybrid(pageReader, 1, 0, dataPage);
    dataPage = dataPage.map((x) => !!x);
  } else if (daph2.encoding === "PLAIN_DICTIONARY" || daph2.encoding === "RLE_DICTIONARY") {
    const bitWidth2 = pageView.getUint8(pageReader.offset++);
    dataPage = new Array(nValues);
    readRleBitPackedHybrid(pageReader, bitWidth2, uncompressedPageSize - 1, dataPage);
  } else if (daph2.encoding === "DELTA_BINARY_PACKED") {
    const int32 = type === "INT32";
    dataPage = int32 ? new Int32Array(nValues) : new BigInt64Array(nValues);
    deltaBinaryUnpack(pageReader, nValues, dataPage);
  } else if (daph2.encoding === "DELTA_LENGTH_BYTE_ARRAY") {
    dataPage = new Array(nValues);
    deltaLengthByteArray(pageReader, nValues, dataPage);
  } else if (daph2.encoding === "DELTA_BYTE_ARRAY") {
    dataPage = new Array(nValues);
    deltaByteArray(pageReader, nValues, dataPage);
  } else if (daph2.encoding === "BYTE_STREAM_SPLIT") {
    dataPage = byteStreamSplit(reader, nValues, type, element.type_length);
  } else {
    throw new Error(`parquet unsupported encoding: ${daph2.encoding}`);
  }
  return { definitionLevels, repetitionLevels, dataPage };
}
function readRepetitionLevelsV2(reader, daph2, schemaPath) {
  const maxRepetitionLevel = getMaxRepetitionLevel(schemaPath);
  if (!maxRepetitionLevel) return [];
  const values = new Array(daph2.num_values);
  readRleBitPackedHybrid(
    reader,
    bitWidth(maxRepetitionLevel),
    daph2.repetition_levels_byte_length,
    values
  );
  return values;
}
function readDefinitionLevelsV2(reader, daph2, schemaPath) {
  const maxDefinitionLevel = getMaxDefinitionLevel(schemaPath);
  if (maxDefinitionLevel) {
    const values = new Array(daph2.num_values);
    readRleBitPackedHybrid(reader, bitWidth(maxDefinitionLevel), daph2.definition_levels_byte_length, values);
    return values;
  }
}

// src/column.js
function readColumn(reader, { groupStart, selectStart, selectEnd }, columnDecoder, onPage) {
  const { columnName, element, utf8 } = columnDecoder;
  const chunks = [];
  let dictionary = void 0;
  let lastChunk = void 0;
  let rowCount = 0;
  const emitLastChunk = onPage && (() => {
    lastChunk && onPage({
      columnName,
      columnData: lastChunk,
      rowStart: groupStart + rowCount - lastChunk.length,
      rowEnd: groupStart + rowCount
    });
  });
  while (rowCount < selectEnd) {
    if (reader.offset >= reader.view.byteLength - 1) break;
    const header = parquetHeader(reader);
    if (header.type === "DICTIONARY_PAGE") {
      dictionary = readPage(reader, header, columnDecoder, dictionary, void 0, 0);
      dictionary = convert(dictionary, element, utf8);
    } else {
      const lastChunkLength = lastChunk?.length || 0;
      const values = readPage(reader, header, columnDecoder, dictionary, lastChunk, selectStart - rowCount);
      if (lastChunk === values) {
        rowCount += values.length - lastChunkLength;
      } else {
        emitLastChunk?.();
        chunks.push(values);
        rowCount += values.length;
        lastChunk = values;
      }
    }
  }
  emitLastChunk?.();
  if (rowCount > selectEnd && lastChunk) {
    chunks[chunks.length - 1] = lastChunk.slice(0, selectEnd - (rowCount - lastChunk.length));
  }
  return chunks;
}
function readPage(reader, header, columnDecoder, dictionary, previousChunk, pageStart) {
  const { type, element, schemaPath, codec, compressors, utf8 } = columnDecoder;
  const compressedBytes = new Uint8Array(
    reader.view.buffer,
    reader.view.byteOffset + reader.offset,
    header.compressed_page_size
  );
  reader.offset += header.compressed_page_size;
  if (header.type === "DATA_PAGE") {
    const daph = header.data_page_header;
    if (!daph) throw new Error("parquet data page header is undefined");
    if (pageStart > daph.num_values && isFlatColumn(schemaPath)) {
      return new Array(daph.num_values);
    }
    const page = decompressPage(compressedBytes, Number(header.uncompressed_page_size), codec, compressors);
    const { definitionLevels, repetitionLevels, dataPage } = readDataPage(page, daph, columnDecoder);
    let values = convertWithDictionary(dataPage, dictionary, element, daph.encoding, utf8);
    if (repetitionLevels.length || definitionLevels?.length) {
      const output = Array.isArray(previousChunk) ? previousChunk : [];
      return assembleLists(output, definitionLevels, repetitionLevels, values, schemaPath);
    } else {
      for (let i = 2; i < schemaPath.length; i++) {
        if (schemaPath[i].element.repetition_type !== "REQUIRED") {
          values = Array.from(values, (e) => [e]);
        }
      }
      return values;
    }
  } else if (header.type === "DATA_PAGE_V2") {
    const daph2 = header.data_page_header_v2;
    if (!daph2) throw new Error("parquet data page header v2 is undefined");
    if (pageStart > daph2.num_rows) {
      return new Array(daph2.num_values);
    }
    const { definitionLevels, repetitionLevels, dataPage } = readDataPageV2(compressedBytes, header, columnDecoder);
    const values = convertWithDictionary(dataPage, dictionary, element, daph2.encoding, utf8);
    const output = Array.isArray(previousChunk) ? previousChunk : [];
    return assembleLists(output, definitionLevels, repetitionLevels, values, schemaPath);
  } else if (header.type === "DICTIONARY_PAGE") {
    const diph = header.dictionary_page_header;
    if (!diph) throw new Error("parquet dictionary page header is undefined");
    const page = decompressPage(
      compressedBytes,
      Number(header.uncompressed_page_size),
      codec,
      compressors
    );
    const reader2 = { view: new DataView(page.buffer, page.byteOffset, page.byteLength), offset: 0 };
    return readPlain(reader2, type, diph.num_values, element.type_length);
  } else {
    throw new Error(`parquet unsupported page type: ${header.type}`);
  }
}
function parquetHeader(reader) {
  const header = deserializeTCompactProtocol(reader);
  const type = PageType[header.field_1];
  const uncompressed_page_size = header.field_2;
  const compressed_page_size = header.field_3;
  const crc = header.field_4;
  const data_page_header = header.field_5 && {
    num_values: header.field_5.field_1,
    encoding: Encoding[header.field_5.field_2],
    definition_level_encoding: Encoding[header.field_5.field_3],
    repetition_level_encoding: Encoding[header.field_5.field_4],
    statistics: header.field_5.field_5 && {
      max: header.field_5.field_5.field_1,
      min: header.field_5.field_5.field_2,
      null_count: header.field_5.field_5.field_3,
      distinct_count: header.field_5.field_5.field_4,
      max_value: header.field_5.field_5.field_5,
      min_value: header.field_5.field_5.field_6
    }
  };
  const index_page_header = header.field_6;
  const dictionary_page_header = header.field_7 && {
    num_values: header.field_7.field_1,
    encoding: Encoding[header.field_7.field_2],
    is_sorted: header.field_7.field_3
  };
  const data_page_header_v2 = header.field_8 && {
    num_values: header.field_8.field_1,
    num_nulls: header.field_8.field_2,
    num_rows: header.field_8.field_3,
    encoding: Encoding[header.field_8.field_4],
    definition_levels_byte_length: header.field_8.field_5,
    repetition_levels_byte_length: header.field_8.field_6,
    is_compressed: header.field_8.field_7 === void 0 ? true : header.field_8.field_7,
    // default true
    statistics: header.field_8.field_8
  };
  return {
    type,
    uncompressed_page_size,
    compressed_page_size,
    crc,
    data_page_header,
    index_page_header,
    dictionary_page_header,
    data_page_header_v2
  };
}

// src/rowgroup.js
function readRowGroup(options, { metadata, columns }, groupPlan) {
  const { file, compressors, utf8 } = options;
  const asyncColumns = [];
  for (const { file_path, meta_data } of groupPlan.rowGroup.columns) {
    if (file_path) throw new Error("parquet file_path not supported");
    if (!meta_data) throw new Error("parquet column metadata is undefined");
    const columnName = meta_data.path_in_schema[0];
    if (columns && !columns.includes(columnName)) continue;
    const { startByte, endByte } = getColumnRange(meta_data);
    const columnBytes = endByte - startByte;
    if (columnBytes > 1 << 30) {
      console.warn(`parquet skipping huge column "${meta_data.path_in_schema}" ${columnBytes} bytes`);
      continue;
    }
    const buffer = Promise.resolve(file.slice(startByte, endByte));
    asyncColumns.push({
      pathInSchema: meta_data.path_in_schema,
      data: buffer.then((arrayBuffer) => {
        const schemaPath = getSchemaPath(metadata.schema, meta_data.path_in_schema);
        const reader = { view: new DataView(arrayBuffer), offset: 0 };
        const subcolumn = meta_data.path_in_schema.join(".");
        const columnDecoder = {
          columnName: subcolumn,
          type: meta_data.type,
          element: schemaPath[schemaPath.length - 1].element,
          schemaPath,
          codec: meta_data.codec,
          compressors,
          utf8
        };
        return readColumn(reader, groupPlan, columnDecoder, options.onPage);
      })
    });
  }
  return { groupStart: groupPlan.groupStart, groupRows: groupPlan.groupRows, asyncColumns };
}
async function asyncGroupToRows({ asyncColumns }, selectStart, selectEnd, columns, rowFormat) {
  const groupData = new Array(selectEnd);
  const columnDatas = await Promise.all(asyncColumns.map(({ data }) => data.then(flatten)));
  const includedColumnNames = asyncColumns.map((child) => child.pathInSchema[0]).filter((name) => !columns || columns.includes(name));
  const columnOrder = columns ?? includedColumnNames;
  const columnIndexes = columnOrder.map((name) => asyncColumns.findIndex((column) => column.pathInSchema[0] === name));
  for (let row = selectStart; row < selectEnd; row++) {
    if (rowFormat === "object") {
      const rowData = {};
      for (let i = 0; i < asyncColumns.length; i++) {
        rowData[asyncColumns[i].pathInSchema[0]] = columnDatas[i][row];
      }
      groupData[row] = rowData;
    } else {
      const rowData = new Array(asyncColumns.length);
      for (let i = 0; i < columnOrder.length; i++) {
        if (columnIndexes[i] >= 0) {
          rowData[i] = columnDatas[columnIndexes[i]][row];
        }
      }
      groupData[row] = rowData;
    }
  }
  return groupData;
}
function assembleAsync(asyncRowGroup, schemaTree2) {
  const { asyncColumns } = asyncRowGroup;
  const assembled = [];
  for (const child of schemaTree2.children) {
    if (child.children.length) {
      const childColumns = asyncColumns.filter((column) => column.pathInSchema[0] === child.element.name);
      if (!childColumns.length) continue;
      const flatData = /* @__PURE__ */ new Map();
      const data = Promise.all(childColumns.map((column) => {
        return column.data.then((columnData) => {
          flatData.set(column.pathInSchema.join("."), flatten(columnData));
        });
      })).then(() => {
        assembleNested(flatData, child);
        const flatColumn = flatData.get(child.path.join("."));
        if (!flatColumn) throw new Error("parquet column data not assembled");
        return [flatColumn];
      });
      assembled.push({ pathInSchema: child.path, data });
    } else {
      const asyncColumn = asyncColumns.find((column) => column.pathInSchema[0] === child.element.name);
      if (asyncColumn) {
        assembled.push(asyncColumn);
      }
    }
  }
  return { ...asyncRowGroup, asyncColumns: assembled };
}

// src/read.js
async function parquetRead(options) {
  options.metadata ??= await parquetMetadataAsync(options.file);
  const asyncGroups = await parquetReadAsync(options);
  const { rowStart = 0, rowEnd, columns, onChunk, onComplete, rowFormat } = options;
  if (!onComplete && !onChunk) {
    for (const { asyncColumns } of asyncGroups) {
      for (const { data } of asyncColumns) await data;
    }
    return;
  }
  const schemaTree2 = parquetSchema(options.metadata);
  const assembled = asyncGroups.map((arg) => assembleAsync(arg, schemaTree2));
  if (onChunk) {
    for (const asyncGroup of assembled) {
      for (const asyncColumn of asyncGroup.asyncColumns) {
        asyncColumn.data.then((columnDatas) => {
          let rowStart2 = asyncGroup.groupStart;
          for (const columnData of columnDatas) {
            onChunk({
              columnName: asyncColumn.pathInSchema[0],
              columnData,
              rowStart: rowStart2,
              rowEnd: rowStart2 + columnData.length
            });
            rowStart2 += columnData.length;
          }
        });
      }
    }
  }
  if (onComplete) {
    const rows = [];
    for (const asyncGroup of assembled) {
      const selectStart = Math.max(rowStart - asyncGroup.groupStart, 0);
      const selectEnd = Math.min((rowEnd ?? Infinity) - asyncGroup.groupStart, asyncGroup.groupRows);
      const groupData = await asyncGroupToRows(asyncGroup, selectStart, selectEnd, columns, rowFormat);
      concat(rows, groupData.slice(selectStart, selectEnd));
    }
    onComplete(rows);
  } else {
    for (const { asyncColumns } of assembled) {
      for (const { data } of asyncColumns) await data;
    }
  }
}
function parquetReadAsync(options) {
  if (!options.metadata) throw new Error("parquet requires metadata");
  const plan = parquetPlan(options);
  options.file = prefetchAsyncBuffer(options.file, plan);
  return plan.groups.map((groupPlan) => readRowGroup(options, plan, groupPlan));
}
async function parquetReadColumn(options) {
  if (options.columns?.length !== 1) {
    throw new Error("parquetReadColumn expected columns: [columnName]");
  }
  options.metadata ??= await parquetMetadataAsync(options.file);
  const asyncGroups = parquetReadAsync(options);
  const schemaTree2 = parquetSchema(options.metadata);
  const assembled = asyncGroups.map((arg) => assembleAsync(arg, schemaTree2));
  const columnData = [];
  for (const rg of assembled) {
    columnData.push(flatten(await rg.asyncColumns[0].data));
  }
  return flatten(columnData);
}

// src/query.js
async function parquetQuery(options) {
  if (!options.file || !(options.file.byteLength >= 0)) {
    throw new Error("parquet expected AsyncBuffer");
  }
  options.metadata ??= await parquetMetadataAsync(options.file);
  const { metadata, rowStart = 0, orderBy, filter } = options;
  if (rowStart < 0) throw new Error("parquet rowStart must be positive");
  const rowEnd = options.rowEnd ?? Number(metadata.num_rows);
  if (filter && !orderBy && rowEnd < metadata.num_rows) {
    const filteredRows = new Array();
    let groupStart = 0;
    for (const group of metadata.row_groups) {
      const groupEnd = groupStart + Number(group.num_rows);
      const groupData = await parquetReadObjects({ ...options, rowStart: groupStart, rowEnd: groupEnd });
      for (const row of groupData) {
        if (matchQuery(row, filter)) {
          filteredRows.push(row);
        }
      }
      if (filteredRows.length >= rowEnd) break;
      groupStart = groupEnd;
    }
    return filteredRows.slice(rowStart, rowEnd);
  } else if (filter) {
    const results = (await parquetReadObjects({ ...options, rowStart: void 0, rowEnd: void 0 })).filter((row) => matchQuery(row, filter));
    if (orderBy) results.sort((a, b) => compare(a[orderBy], b[orderBy]));
    return results.slice(rowStart, rowEnd);
  } else if (typeof orderBy === "string") {
    const orderColumn = await parquetReadColumn({ ...options, rowStart: void 0, rowEnd: void 0, columns: [orderBy] });
    const sortedIndices = Array.from(orderColumn, (_, index) => index).sort((a, b) => compare(orderColumn[a], orderColumn[b])).slice(rowStart, rowEnd);
    const sparseData = await parquetReadRows({ ...options, rows: sortedIndices });
    const data = sortedIndices.map((index) => sparseData[index]);
    return data;
  } else {
    return await parquetReadObjects(options);
  }
}
async function parquetReadRows(options) {
  const { file, rows } = options;
  options.metadata ||= await parquetMetadataAsync(file);
  const { row_groups: rowGroups } = options.metadata;
  const groupIncluded = Array(rowGroups.length).fill(false);
  let groupStart = 0;
  const groupEnds = rowGroups.map((group) => groupStart += Number(group.num_rows));
  for (const index of rows) {
    const groupIndex = groupEnds.findIndex((end) => index < end);
    groupIncluded[groupIndex] = true;
  }
  const rowRanges = [];
  let rangeStart;
  groupStart = 0;
  for (let i = 0; i < groupIncluded.length; i++) {
    const groupEnd = groupStart + Number(rowGroups[i].num_rows);
    if (groupIncluded[i]) {
      if (rangeStart === void 0) {
        rangeStart = groupStart;
      }
    } else {
      if (rangeStart !== void 0) {
        rowRanges.push([rangeStart, groupEnd]);
        rangeStart = void 0;
      }
    }
    groupStart = groupEnd;
  }
  if (rangeStart !== void 0) {
    rowRanges.push([rangeStart, groupStart]);
  }
  const sparseData = new Array(Number(options.metadata.num_rows));
  for (const [rangeStart2, rangeEnd] of rowRanges) {
    const groupData = await parquetReadObjects({ ...options, rowStart: rangeStart2, rowEnd: rangeEnd });
    for (let i = rangeStart2; i < rangeEnd; i++) {
      sparseData[i] = groupData[i - rangeStart2];
      sparseData[i].__index__ = i;
    }
  }
  return sparseData;
}
function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
function matchQuery(record, query = {}) {
  if (query.$not) {
    return !matchQuery(record, query.$not);
  }
  if (query.$and) {
    return query.$and.every((subQuery) => matchQuery(record, subQuery));
  }
  if (query.$or) {
    return query.$or.some((subQuery) => matchQuery(record, subQuery));
  }
  return Object.entries(query).every(([field, condition]) => {
    const value = record[field];
    if (condition !== null && (Array.isArray(condition) || typeof condition !== "object")) {
      return equals(value, condition);
    }
    return Object.entries(condition || {}).every(([operator, target]) => {
      switch (operator) {
        case "$gt":
          return value > target;
        case "$gte":
          return value >= target;
        case "$lt":
          return value < target;
        case "$lte":
          return value <= target;
        case "$ne":
          return !equals(value, target);
        case "$in":
          return Array.isArray(target) && target.includes(value);
        case "$nin":
          return Array.isArray(target) && !target.includes(value);
        case "$not":
          return !matchQuery({ [field]: value }, { [field]: target });
        default:
          return true;
      }
    });
  });
}

// src/hyparquet.js
function parquetReadObjects(options) {
  return new Promise((onComplete, reject) => {
    parquetRead({
      rowFormat: "object",
      ...options,
      onComplete
    }).catch(reject);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  asyncBufferFromFile,
  asyncBufferFromUrl,
  byteLengthFromUrl,
  cachedAsyncBuffer,
  flatten,
  parquetMetadata,
  parquetMetadataAsync,
  parquetQuery,
  parquetRead,
  parquetReadObjects,
  parquetSchema,
  snappyUncompress,
  toJson
});
