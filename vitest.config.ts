import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // ✅ clave: activa jsdom
    globals: true,        // opcional: te permite usar describe/it/expect sin import
    setupFiles: "./tests/setup.ts", // opcional, para mocks globales
  },
});