#!/usr/bin/env zx

/**
 * Bootstraps for a new release.
 *
 * Usage:
 *  zx release.mjs <package>/<version> [--commit|-c] [--github-token=<token>]
 *
 */

import minimist from "minimist";
import fs from "node:fs/promises";
import libxml from "libxmljs";
import "dotenv/config";

const argv = minimist(process.argv.slice(3));

const releaseName = argv._[0];
const [packageName, version] = releaseName.split("/");
if (!packageName || !version) {
  throw new Error(`ERROR: Invalid release name "${releaseName}"`);
}

const packageRoot = `packages/${packageName}`;
const packageDirectoryStat = await fs.stat(packageRoot);
if (!packageDirectoryStat.isDirectory()) {
  throw new Error(`ERROR: Package "${packageRoot}" does not exist`);
}

// Update package.json
const packageJsonPath = `${packageRoot}/package.json`;
const packageJsonString = await fs.readFile(packageJsonPath);
const packageJson = JSON.parse(packageJsonString);
packageJson.version = version;
await fs.writeFile(
  `${packageRoot}/package.json`,
  `${JSON.stringify(packageJson, undefined, 2)}\n`
);

// Update config.xml
const configXml = await fs.readFile(`${packageRoot}/config.xml`);
const configDocument = libxml.parseXml(configXml);

configDocument.root().attr("version", version);

await fs.writeFile(`${packageRoot}/config.xml`, configDocument.toString());

// Update changelog
const githubToken = argv["github-token"];
if (githubToken) {
  process.env.GITHUB_TOKEN = githubToken;
}

// eslint-disable-next-line unicorn/prefer-module
await $`zx ${__dirname}/changelog.mjs --release=client/${version}`;

// Print instructions to commit and release
const commit = argv.commit ?? argv.c;
if (commit) {
  await $`git add ${packageRoot}`;
  await $`git commit -m "Release ${releaseName}"`;
  await $`git push origin main`;
  await $`git tag ${releaseName}`;
  await $`git push origin ${releaseName}`;
} else {
  console.log(`
  # Commit and push changes:
  git add ${packageRoot}
  git commit -m "Release ${releaseName}"
  git push origin main
  git tag ${releaseName}
  git push origin ${releaseName}
  `);
}
