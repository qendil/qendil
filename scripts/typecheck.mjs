import esbuild from "esbuild";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";

const buildMode = process.argv.includes("--write")
  ? "write-output"
  : "readonly";

await esbuild.build({
  plugins: [
    typecheckPlugin({
      build: true,
      buildMode,
    }),
  ],
});
