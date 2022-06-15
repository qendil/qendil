/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs");
const xmlToJs = require("xml2js");

const SUFFIX_TO_CODE = {
  alpha: 10,
  beta: 20,
  rc: 35,
  rc0: 30,
  rc1: 31,
  rc2: 32,
};

function calculateVersionCode(fullVersion) {
  const [version, suffix] = fullVersion.split("-");
  const suffixCode = SUFFIX_TO_CODE[suffix] || 50;

  const [major, minor, patch] = version
    .split(".")
    .map((v) => Number.parseInt(v, 10));

  return major * 10_000_000 + minor * 100_000 + patch * 100 + suffixCode;
}

module.exports = async (context) => {
  const { projectRoot, platforms } = context.opts;

  const { version } = require(path.join(projectRoot, `package.json`));
  const versionCode = calculateVersionCode(version);

  const pending = platforms.map(async (platform) => {
    if (platform === "android") {
      const manifestPath = path.join(
        "platforms/android/app/src/main/AndroidManifest.xml"
      );
      const manifestXml = fs.readFileSync(manifestPath, "utf8");
      const manifestJson = await xmlToJs.parseStringPromise(manifestXml);

      const manifestNode = manifestJson.manifest;
      manifestNode.$["android:versionName"] = version;
      manifestNode.$["android:versionCode"] = versionCode;

      const manifestBuilder = new xmlToJs.Builder();
      const manifestXmlNew = manifestBuilder.buildObject(manifestJson);
      fs.writeFileSync(manifestPath, manifestXmlNew);
    }
  });

  await Promise.all(pending);
};
