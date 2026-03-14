# Coma Web Demo ☄️

This package contains a React-based benchmark application visualizing the performance comparison between traditional streaming JSON and **Coma (CSV)**.

## 🎯 Purpose

To demonstrate the token efficiency and zero-latency rendering of CSV streams for **flat structured data** (tabular lists of objects) compared to `JSON.parse` and `partial-json`.

## ⚠️ Data Limitation

The demo uses a dataset of startups (id, name, industry, description). All comparisons are based on **flat structures**. Coma is not intended for nested or hierarchical data models.

## 🛠 Commands

```bash
# Start local dev server
pnpm dev
```
