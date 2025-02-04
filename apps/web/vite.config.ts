import { defineConfig } from 'vite'
import { fileURLToPath, URL } from "node:url";
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@schematoform/schema-to-form": fileURLToPath(
        new URL("../../packages/schema-to-form/src", import.meta.url)
      ),
    },
  },
});
