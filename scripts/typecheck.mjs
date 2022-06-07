import esbuild from "esbuild";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";

await esbuild.build({ plugins: [typecheckPlugin({ build: true })] });
