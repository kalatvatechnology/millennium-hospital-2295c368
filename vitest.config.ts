import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for pure modules only (no app/Worker plugins).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
