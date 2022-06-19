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

async function updatePackageJson() {
  const packageJsonPath = `${packageRoot}/package.json`;
  const packageJsonString = await fs.readFile(packageJsonPath);
  const packageJson = JSON.parse(packageJsonString);
  packageJson.version = version;
  await fs.writeFile(
    `${packageRoot}/package.json`,
    `${JSON.stringify(packageJson, undefined, 2)}\n`
  );
}

async function updateCargoToml() {
  const cargoTomlPath = `${packageRoot}/Cargo.toml`;
  const cargoTomlStat = await fs.state(cargoTomlPath);
  if (!cargoTomlStat.isFile()) return;

  const cargoToml = await fs.readFile(cargoTomlPath);
  const updatedCargoToml = cargoToml.replace(
    /^version = ".*"$/m,
    `version = "${version}"`
  );
  await fs.writeFile(cargoTomlPath, updatedCargoToml);
}

async function updateConfigXml() {
  const configXmlPath = `${packageRoot}/config.xml`;
  const configXmlStat = await fs.state(configXmlPath);
  if (!configXmlStat.isFile()) return;

  const configXml = await fs.readFile(configXmlPath);
  const configDocument = libxml.parseXml(configXml);

  configDocument.root().attr("version", version);

  await fs.writeFile(configXmlPath, configDocument.toString());
}

// Update changelog
async function updateChangelog() {
  const githubToken = argv["github-token"];
  if (githubToken) {
    process.env.GITHUB_TOKEN = githubToken;
  }

  // eslint-disable-next-line unicorn/prefer-module
  await $`zx ${__dirname}/changelog.mjs --release=client/${version}`;
}

await Promise.all([
  updatePackageJson(),
  updateCargoToml(),
  updateConfigXml(),
  updateChangelog(),
]);

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
