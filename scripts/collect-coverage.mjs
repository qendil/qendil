#!/usr/bin/env zx

import { $, cd, globby, path } from "zx";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

const CC_REPORTER_BINARY_URL =
  "https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64";

// Download codeclimate executable
const cc = "/tmp/cc-reporter";

try {
  await fs.access(cc, fsConstants.X_OK);
} catch {
  const ccDownload = await fetch(CC_REPORTER_BINARY_URL);
  const buf = await ccDownload.arrayBuffer();
  const ccReporterFile = await fs.open(cc, "w");
  try {
    await ccReporterFile.write(Buffer.from(buf));
  } finally {
    await ccReporterFile.close();
  }
}

// Make file executable
await fs.chmod(cc, 0o755);

// Process lcov coverage reports
const lcovFiles = await globby([
  "**/coverage/lcov.info",
  "!**/node_modules/**",
]);

const originalCwd = process.cwd();
try {
  await Promise.all(
    lcovFiles.map(async (file, index) => {
      const coverageRoot = path.dirname(path.dirname(file));
      const outFile = `${path.basename(coverageRoot)}-${index}.json`;

      cd(coverageRoot);

      await $`${cc} format-coverage ${file} --input-type lcov --prefix ${coverageRoot}/ --output /tmp/coverage/${outFile}`;
    })
  );
} finally {
  cd(originalCwd);
}

// Aggregate coverage reports
const coverageFiles = await globby(["/tmp/coverage/*.json"]);
await $`${cc} sum-coverage ${coverageFiles} --output /tmp/cc-coverage.json`;

// Upload coverage report
await $`${cc} upload-coverage --input /tmp/cc-coverage.json`;
