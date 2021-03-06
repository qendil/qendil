/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import type { PluginOption } from "vite";
import { defineConfig, loadEnv } from "vite";
import { short as gitShort } from "git-rev";

import react from "@vitejs/plugin-react";
import { createHtmlPlugin } from "vite-plugin-html";
import { VitePWA as vitePWA } from "vite-plugin-pwa";
import viteSentry from "vite-plugin-sentry";
import viteRemoveAttributes from "vite-plugin-react-remove-attributes";

import packageJson from "./package.json";

import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Inline plugin to make service worker scope on the entire app,
 * In production, `/workers/sw.ts` is compiled to `/sw.js` which has `/` scope,
 * We want to simulate the same scope in development
 */
function serviceWorkerDevelopmentServerRootScope(): PluginOption {
  return {
    name: "sw-response-header",
    configureServer: (server): void => {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("Service-Worker-Allowed", "/");
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

  // Load .env files
  const environment: Record<string, string | undefined> = loadEnv(
    mode,
    path.join(currentDirectory, "../.."),
    "CLIENT_"
  );

  const PROD_DEBUG = String(
    environment.CLIENT_PROD_DEBUG ?? "false"
  ).toLowerCase();

  const isProduction = mode === "production";
  const isProductionDebug =
    isProduction && !["0", "false"].includes(PROD_DEBUG);

  // Generate the version number
  const commitHash: string = await new Promise(gitShort);
  const appVersion = `${packageJson.version}+${commitHash}`;

  // Used to generate the manifest file for the PWA
  const appManifest = {
    name: "Qendil",
    // eslint-disable-next-line camelcase
    background_color: "#000000",
    // eslint-disable-next-line camelcase
    theme_color: "#282425",
    // eslint-disable-next-line camelcase
    start_url: "/?utm_source=a2hs",
    icons: [
      {
        src: "icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "mask-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "monochrome",
      },
      // Used for the splash screen
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  // Various app related info
  const appConfig = {
    ...appManifest,
    platform: environment.CLIENT_PLATFORM || "browser",
    description: packageJson.description,
    version: appVersion,
    mode,
  } as const;

  // Shared rollup options
  const rollupOptions = {
    output: isProductionDebug
      ? {
          assetFileNames: `assets/[name]_[hash].[ext]`,
          chunkFileNames: `assets/[name]_[hash].js`,
          entryFileNames: `assets/[name]_[hash].js`,
        }
      : {
          assetFileNames: `assets/[hash].[ext]`,
          chunkFileNames: `assets/[hash].js`,
          entryFileNames: `assets/[hash].js`,
        },
  } as const;

  const sentryEnvironment = environment.CLIENT_SENTRY_ENVIRONMENT || mode;
  const uploadToSentry = Boolean(environment.CLIENT_SENTRY_AUTH_TOKEN);

  return {
    base: "",
    define: {
      __APP_NAME__: JSON.stringify(appConfig.name),
      __APP_VERSION__: JSON.stringify(appConfig.version),
      __APP_PLATFORM__: JSON.stringify(appConfig.platform),
      __SENTRY_DSN__: JSON.stringify(
        environment.CLIENT_SENTRY_DSN || undefined
      ),
      __SENTRY_ENVIRONMENT__: JSON.stringify(sentryEnvironment),
    },
    plugins: [
      react(),
      createHtmlPlugin({
        template: "src/index.html",
        inject: { data: appConfig },
        minify: isProduction && {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          keepClosingSlash: false,
        },
      }),
      vitePWA({
        srcDir: "src",
        filename: "service-worker.ts",
        manifest: appManifest,
        strategies: "injectManifest",
        // eslint-disable-next-line unicorn/no-null
        injectRegister: null,
        injectManifest: {
          // Seems to ignore assets if i don't do this
          globPatterns: ["**/*"],
          globIgnores: [
            "manifest.webmanifest",
            "pwa-*x*.png",
            "**/*.br",
            "**/*.gz",
            "**/*.js.map",
          ],
          dontCacheBustURLsMatching: /assets\/[\da-z]{8}\..+/,
          injectionPoint: "__WB_MANIFEST",
        },
      }),
      isProduction &&
        viteRemoveAttributes({
          attributes: ["data-testid"],
        }),
      uploadToSentry &&
        viteSentry({
          authToken: environment.CLIENT_SENTRY_AUTH_TOKEN,
          org: environment.CLIENT_SENTRY_ORG || "sdrmme",
          project: environment.CLIENT_SENTRY_PROJECT || "qendil",
          release: `client@${appVersion}`,
          deploy: { env: sentryEnvironment },
          sourceMaps: { include: ["./www"] },
          setCommits: { auto: true },
          finalize: true,
        }),
      serviceWorkerDevelopmentServerRootScope(),
    ],
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
      outDir: "www",
      sourcemap: uploadToSentry ? "hidden" : false,
    },
    worker: {
      format: "es",
      rollupOptions,
    },
    assetsInclude: ["**/*.gltf", "**/*.bin", "**/*.glb", "**/*.ktx2"],
    test: {
      root: "src",
      globals: true,
      environment: "jsdom",
      setupFiles: ["setuptests.tsx"],
      coverage: {
        reporter: ["lcov", "text"],
      },
    },
  };
});
