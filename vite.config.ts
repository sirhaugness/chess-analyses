/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function resolveBasePath(env: Record<string, string>): string {
  if (env.VITE_BASE_PATH) {
    const p = env.VITE_BASE_PATH;
    return p.endsWith("/") ? p : `${p}/`;
  }
  const repo = env.GITHUB_REPOSITORY;
  if (repo && repo.endsWith(".github.io")) return "/";
  if (repo) return `/${repo.split("/")[1]}/`;
  return "/";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = resolveBasePath(env);

  return {
    base,
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: "./tests/setup.ts",
      include: ["tests/**/*.test.ts"],
    },
  };
});
