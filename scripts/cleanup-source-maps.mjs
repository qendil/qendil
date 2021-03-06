/**
 * Removes all sources files from the www/ directory
 *
 * Usage:
 *  zx cleanup-source-maps.mjs
 *
 */

import { globby } from "zx";
import fs from "node:fs/promises";

const files = await globby("www/**/*.js.map");

const pending = files.map(async (file) => {
  console.log(`Cleaning up: ${file}`);
  return fs.rm(file);
});

await Promise.all(pending);
