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

# Build for production
pnpm build
```

## 🚀 Deployment

This project is configured for automated deployment to **GitHub Pages** via GitHub Actions.

1.  **Repository Settings**: Go to `Settings > Pages` in your GitHub repository.
2.  **Build and deployment**: Set "Source" to `GitHub Actions`.
3.  **Push to main**: Any push to the `main` branch will automatically trigger the deployment workflow defined in `.github/workflows/deploy.yml`.

The live demo will be available at: `https://Hunter-Gu.github.io/coma/`
