// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://Hunter-Gu.github.io',
  base: '/coma',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
