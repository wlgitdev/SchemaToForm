import { defineConfig } from 'vite'
import { fileURLToPath, URL } from "node:url";
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@schematoform/schema-to-ui": fileURLToPath(
        new URL("../../packages/schema-to-ui/src", import.meta.url)
      ),
    },
  },
});
