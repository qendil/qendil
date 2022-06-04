import "./node.d.ts";

import { defineConfig, loadEnv } from "vite";
import { short as gitShort } from "git-rev";

import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
import path from "node:path";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

  // Load .env files
  const environment: Record<string, string | undefined> = loadEnv(
    mode,
    path.join(currentDirectory, ".."),
    "CLIENT_"
  );

  console.log(environment);

  const PROD_DEBUG = String(
    environment.CLIENT_PROD_DEBUG ?? "false"
  ).toLowerCase();

  const isProduction = mode === "production";
  const isProductionDebug =
    isProduction && !["0", "false"].includes(PROD_DEBUG);

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
      assetFileNames: `assets/${
        isProductionDebug ? "[name]_" : ""
      }[hash].[ext]`,
      chunkFileNames: `assets/${isProductionDebug ? "[name]_" : ""}[hash].js`,
      entryFileNames: `assets/${isProductionDebug ? "[name]_" : ""}[hash].js`,
    },
  } as const;

  return {
    base: "",
    define: {
      __APP_NAME__: JSON.stringify(appConfig.name),
      __APP_VERSION__: JSON.stringify(appConfig.version),
    },
    plugins: [react()],
    esbuild: {
      pure: isProductionDebug
        ? []
        : ["console.log", "console.info", "console.debug"],
    },
    css: {
      modules: {
        generateScopedName: isProduction
          ? "[hash:base64:7]"
          : "[name]__[local]",
      },
    },
    json: {
      // Stringified JSONs are apparently more compact most of the time.
      stringify: true,
    },
    build: {
      rollupOptions,
      sourcemap: "hidden",
      outDir: "www",
    },
    worker: {
      format: "es",
      rollupOptions,
    },
    assetsInclude: ["**/*.gltf", "**/*.bin", "**/*.glb", "**/*.ktx2"],
  };
});
