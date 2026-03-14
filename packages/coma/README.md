# Coma

A token-efficient CSV streaming library for **flat structured data** in LLM applications, as a lightweight alternative to streaming JSON.

> [!IMPORTANT]
> **Optimized for Flat Data Only**: Coma is designed for tabular datasets (lists of objects). It does **not** support nested JSON structures or hierarchical trees.

## 🎯 Why Coma?

Streaming large structured datasets via JSON often incurs significant token overhead due to repetitive keys and complex syntax. Coma (CSV) provides a stateful, granular parsing system that turns raw CSV streams into structured data with **up to 40% fewer tokens** and zero-latency rendering.

- **Purpose**: A specialized tool to bridge the gap between raw CSV streams and structured application data.
- **Benefits**: Significant token savings compared to streaming JSON, with zero-latency parsing.
- **When to Use**: When you need to stream large amounts of structured data from an LLM or process massive CSV files with minimal memory overhead.

## ✨ Features

- **🔄 Sync & Stream Support**: Seamlessly transition from processing full datasets to handling real-time chunks.
- **🎯 Precision Parsing**: Choose between `ByLine` (row-based) or `ByField` (granular) processing depending on your stream stability.
- **💾 Stateful Accumulation**: Internal buffers automatically handle data fragments and incomplete lines.
- **🛡️ TypeScript First**: Full type safety with generic support for custom row structures.
- **🪶 Zero Dependencies**: Extremely lightweight and optimized for speed.

## ⚠️ Limitations

Coma is optimized for **flat structured data**. It is not designed to handle complex nested objects or arrays within fields.

- **✅ Best For**: Lists of objects, logs, tabular datasets, startup directories, etc.
- **❌ Not For**: Deeply nested JSON structures, hierarchical trees, or recursive data models.

## 🚀 Quick Start

### Installation

```bash
# Using pnpm
pnpm add @neilguuu/coma

# Using npm
npm install @neilguuu/coma
```

### Usage Examples

#### 1. Synchronous Parsing

Use `LineParser` when you have the full CSV content.

```typescript
import { LineParser } from "@neilguuu/coma"

const headers = ["id", "name", "role"]
const parse = LineParser(headers)

const data = parse("1,Alice,Admin\n2,Bob,User")
console.log(data)
// Output: [{id: "1", name: "Alice", role: "Admin"}, {id: "2", name: "Bob", role: "User"}]
```

#### 2. Chunked Streaming

`LineStream` automatically buffers incomplete lines between chunks.

```typescript
import { LineStream } from "@neilguuu/coma"

const headers = ["id", "name"]
const stream = LineStream(headers)

// Process first chunk
const part1 = stream("1,Alice\n2,B")
console.log(part1)
// Output: [[{key: "id", value: "1"}, {key: "name", value: "Alice"}]]

// Process second chunk
const part2 = stream("ob\n")
console.log(part2)
// Output: [[{key: "id", value: "2"}, {key: "name", value: "Bob"}]]
```

#### 3. Granular Field Processing

If your data is highly fragmented, use the `FieldStream` variants.

```typescript
import { FieldStream } from "@neilguuu/coma"

const headers = ["key", "value"]
const stream = FieldStream(headers)

stream("A,1,B") // Buffers "B"
const result = stream(",2\n")
console.log(result)
// Output: [[{key: "key", value: "B"}, {key: "value", value: "2"}]]
```

#### 4. Using the `collect` Utility

Simplify building objects from a stream of fields without manual boilerplate.

```typescript
import { collect, FieldStream } from "@neilguuu/coma"

const stream = FieldStream(["id", "name"])
let data = []

// In your stream handler:
const newFields = stream("1,Alice\n2,B")
data = collect(data, newFields)
// data: [{id: "1", name: "Alice"}, {id: "2"}]
```

## 🛠 API Reference

### Synchronous Parsers

- `LineParser<T, Item>(headers: T): (csv: string) => Item[]`
- `FieldParser<T, Item>(headers: T): (csv: string) => Item[]`

### Streaming Parsers

- `LineStream(headers: string[]): (chunk: string) => Field[][]`
- `FieldStream(headers: string[]): (chunk: string) => Field[][]`

### Utilities

- `collect<T>(currentItems: T[], newFields: Field[][]): T[]`

## 📄 License

MIT
