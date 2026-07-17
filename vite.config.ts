/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** GitHub Pages base for this repository (Settings → Pages → /chess-analyses/) */
const GITHUB_PAGES_BASE = "/chess-analyses/";

function resolveBasePath(env: Record<string, string>, mode: string): string {
  if (env.VITE_BASE_PATH) {
    const p = env.VITE_BASE_PATH;
    return p.endsWith("/") ? p : `${p}/`;
  }

  // GitHub Actions production deploy (GITHUB_REPOSITORY is set in CI)
  if (mode === "production" && env.GITHUB_REPOSITORY) {
    if (env.GITHUB_REPOSITORY.endsWith(".github.io")) return "/";
    return GITHUB_PAGES_BASE;
  }

  // Local dev and local production builds
  return "/";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = resolveBasePath(env, mode);

  return {
    base,
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: "./tests/setup.ts",
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    },
  };
});
