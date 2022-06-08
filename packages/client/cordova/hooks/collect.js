/**
 * Collects output files and places them in a `dist/` directory.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs/promises");
const glob = require("glob");

module.exports = async (context) => {
  const { projectRoot, platforms, options } = context.opts;
  const { noCollect } = options;

  if (noCollect) return;

  const pkg = require(path.join(projectRoot, `package.json`));

  const BASE_NAME = `qendil_${pkg.version}`;
  const OUTPUT_DIRECTORY = path.join(projectRoot, "dist");

  async function collectIfExists(pattern, toName, matchOptions) {
    let filePath;
    try {
      const files = await new Promise((resolve, reject) => {
        glob(pattern, matchOptions, (error, matchedFiles) => {
          if (error) {
            reject(error);
          } else {
            resolve(matchedFiles);
          }
        });
      });

      if (files.length === 0) return;
      filePath = files[0];
    } catch {}

    if (!filePath) return;

    const targetPath = path.join(OUTPUT_DIRECTORY, toName);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    return fs.rename(filePath, targetPath);
  }

  async function collectLinux(sourceDirectory) {
    return Promise.all([
      collectIfExists(
        `${sourceDirectory}/*.tar.gz`,
        `${BASE_NAME}_linux-x64.tar.gz`,
        { ignore: "**/*@(-arm64|-armv7l|-ia32).tar.gz" }
      ),
      collectIfExists(
        `${sourceDirectory}/*-ia32.tar.gz`,
        `${BASE_NAME}_linux-x32.tar.gz`
      ),
      collectIfExists(
        `${sourceDirectory}/*-armv7l.tar.gz`,
        `${BASE_NAME}_linux-armv7.tar.gz`
      ),
      collectIfExists(
        `${sourceDirectory}/*-arm64.tar.gz`,
        `${BASE_NAME}_linux-arm64.tar.gz`
      ),
    ]);
  }

  async function collectMac(sourceDirectory) {
    return Promise.all([
      collectIfExists(
        `${sourceDirectory}/*-mac.zip`,
        `${BASE_NAME}_mac-intel.zip`,
        { ignore: "**/*-arm64-mac.zip" }
      ),
      collectIfExists(
        `${sourceDirectory}/*-arm64-mac.zip`,
        `${BASE_NAME}_mac-arm64.zip`
      ),
    ]);
  }

  async function collectWindows(sourceDirectory) {
    return Promise.all([
      collectIfExists(
        `${sourceDirectory}/*-win.zip`,
        `${BASE_NAME}_windows-x64.zip`,
        { ignore: "**/*@(-arm64|-ia32)-win.zip" }
      ),
      collectIfExists(
        `${sourceDirectory}/*-ia32-win.zip`,
        `${BASE_NAME}_windows-x32.zip`
      ),
      collectIfExists(
        `${sourceDirectory}/*-arm64-win.zip`,
        `${BASE_NAME}_windows-arm64.zip`
      ),
      collectIfExists(
        `${sourceDirectory}/*.exe`,
        `${BASE_NAME}_windows-x64-portable.exe`
      ),
    ]);
  }

  async function collectElectron() {
    const sourceDirectory = path.join(projectRoot, "platforms/electron/build");

    return Promise.all([
      collectLinux(sourceDirectory),
      collectMac(sourceDirectory),
      collectWindows(sourceDirectory),
    ]);
  }

  async function collectAndroid() {
    const sourceDirectory = path.join(
      projectRoot,
      "platforms/android/app/build/outputs"
    );

    return Promise.all([
      collectIfExists(
        `${sourceDirectory}/apk/release/*.apk`,
        `${BASE_NAME}_android.apk`
      ),
      collectIfExists(
        `${sourceDirectory}/bundle/release/*.aab`,
        `${BASE_NAME}_android.aab`
      ),
    ]);
  }

  const pending = platforms.map(async (platform) => {
    if (platform === "electron") return collectElectron();
    if (platform === "android") return collectAndroid();
  });

  await Promise.all(pending);
};
