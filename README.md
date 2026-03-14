# Coma ☄️

A high-performance monorepo for token-efficient data streaming in LLM applications.

## 📦 Project Structure

This is a monorepo managed with `pnpm`.

- **[packages/coma](file:///Users/a1234/github/coma/packages/coma)**: Core CSV streaming library. Token-efficient alternative to streaming JSON for flat data.
- **[packages/web](file:///Users/a1234/github/coma/packages/web)**: Demo application visualizing the performance comparison between JSON and Coma (CSV).

## 🚀 Key Value Proposition

**Coma** solves the "Streaming JSON Overhead" problem by using structured CSV streams with granular state-safe parsers.

- **Purpose**: A specialized tool to bridge the gap between raw CSV streams and structured application data.
- **Limitation**: Optimized **ONLY for flat structured data** (no nested objects or arrays).
- **Benefits**: Up to **40% token savings** compared to streaming JSON, with zero-latency parsing.

## 🛠 Quick Start

```bash
# Install dependencies
pnpm install

# Build the core package
pnpm --filter @neilguuu/coma run build

# Run the web demo
pnpm --filter web run dev
```

## 📄 Documentation

- [packages/coma README](file:///Users/a1234/github/coma/packages/coma/README.md) - API & Usage.

---

License: MIT
