import "./node.d.ts";

import { defineConfig, loadEnv } from "vite";
import { short as gitShort } from "git-rev";

import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load .env files
  const env = loadEnv(mode, path.join(__dirname, ".."));

  const PROD_DEBUG = String(env.CLIENT_PROD_DEBUG ?? "false").toLowerCase();

  const isProd = mode === "production";
  const isProdDebug = isProd && !["0", "false"].includes(PROD_DEBUG);

  // Generate the version number
  const commitHash: string = await new Promise(gitShort);
  const appVersion = `${packageJson.version}+${commitHash}`;

  // Various app related info
  const appConfig = {
    name: "Qendil",
    description: packageJson.description,
    version: appVersion,
  } as const;

  // Shared rollup options
  const rollupOptions = {
    output: {
      assetFileNames: `assets/${isProdDebug ? "[name]_" : ""}[hash].[ext]`,
      chunkFileNames: `assets/${isProdDebug ? "[name]_" : ""}[hash].js`,
      entryFileNames: `assets/${isProdDebug ? "[name]_" : ""}[hash].js`,
    },
  } as const;

  return {
    root: "src",
    base: "",
    define: {
      __APP_NAME__: JSON.stringify(appConfig.name),
      __APP_VERSION__: JSON.stringify(appConfig.version),
    },
    plugins: [react()],
    esbuild: {
      pure: isProdDebug ? [] : ["console.log", "console.info", "console.debug"],
    },
    css: {
      modules: {
        generateScopedName: isProd ? "[hash:base64:7]" : "[name]__[local]",
      },
    },
    json: {
      // Stringified JSONs are apparently more compact most of the time.
      stringify: true,
    },
    build: {
      rollupOptions,
      sourcemap: "hidden",
      outDir: "../www",
    },
    worker: {
      format: "es",
      rollupOptions,
    },
    assetsInclude: ["**/*.gltf", "**/*.bin", "**/*.glb", "**/*.ktx2"],
  };
});
