/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs/promises");
const glob = require("glob");
const libxml = require("libxmljs");

const SUFFIX_TO_CODE = {
  alpha: 10,
  beta: 20,
  rc: 35,
  rc0: 30,
  rc1: 31,
  rc2: 32,
};

function getVersionCode(fullVersion) {
  const [version, suffix] = fullVersion.split("-");
  const suffixCode = suffix === undefined ? 50 : SUFFIX_TO_CODE[suffix];
  if (suffixCode === undefined) {
    throw new Error(`ERROR: Unknown version suffix "${fullVersion}"`);
  }

  const [major, minor, patch] = version
    .split(".")
    .map((v) => Number.parseInt(v, 10));

  return major * 10_000_000 + minor * 100_000 + patch * 100 + suffixCode;
}

function getTrimmedVersion(fullVersion) {
  const [version] = fullVersion.split("-");

  const [major, minor, patch] = version
    .split(".")
    .map((v) => Number.parseInt(v, 10));

  return `${major}.${minor}.${patch}`;
}

async function updateElectronConfig(projectRoot, version, configXmlPath) {
  const configPath = path.join(
    projectRoot,
    "platforms/electron",
    configXmlPath
  );
  const configXml = await fs.readFile(configPath, "utf8");
  const configDocument = libxml.parseXml(configXml);

  configDocument.root().attr("version", version);

  return fs.writeFile(configPath, configDocument.toString());
}

async function updateElectronPackageJson(projectRoot, version) {
  const packageJsonPath = path.join(
    projectRoot,
    "platforms/electron/www/package.json"
  );

  const packageJson = require(packageJsonPath);

  packageJson.version = version;

  return fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, undefined, 2),
    "utf8"
  );
}

async function updateElectronMainScript(projectRoot) {
  const cdvElectronMainPath = path.join(
    projectRoot,
    "platforms/electron/platform_www/cdv-electron-main.js"
  );

  const cdvElectronMain = await fs.readFile(cdvElectronMainPath, "utf8");

  // Cordova-electron is using a custom protocol, but does not give it enough
  // permissions to run service workers and fetch wasm files
  const from = "privileges: { standard: true, secure: true }";
  const to = `privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    allowServiceWorkers: true,
  }`;

  // Make sure that either strings is in the file
  // This might happen if a new version of cordova-electron changed
  // the file and that we'd need to update it (or hopefully get rid of it)
  if (!cdvElectronMain.includes(from) && !cdvElectronMain.includes(to)) {
    throw new Error(
      "Error: cdv-electron-main does not contain privileges string"
    );
  }

  const updated = cdvElectronMain.replace(from, to);
  return fs.writeFile(cdvElectronMainPath, updated, "utf8");
}

async function updateAndroidManifest(projectRoot, version) {
  const manifestPath = path.join(
    projectRoot,
    "platforms/android/app/src/main/AndroidManifest.xml"
  );
  const manifestXml = await fs.readFile(manifestPath, "utf8");
  const manifestDocument = libxml.parseXml(manifestXml);

  manifestDocument
    .root()
    .attr("android:versionName", version)
    .attr("android:versionCode", getVersionCode(version));

  return fs.writeFile(manifestPath, manifestDocument.toString());
}

async function updateIOSConfig(projectRoot, version) {
  const configXmlMatches = glob.sync(
    path.join(projectRoot, "platforms/ios/*/config.xml")
  );

  if (configXmlMatches.length === 0) {
    throw new Error("ERROR: Could not find IOS config.xml");
  }

  const configPath = configXmlMatches[0];
  const configXml = await fs.readFile(configPath, "utf8");
  const configDocument = libxml.parseXml(configXml);

  configDocument.root().attr("version", version);

  return fs.writeFile(configPath, configDocument.toString());
}

async function updateIOSPlist(projectRoot, version) {
  const plistMatches = glob.sync(
    path.join(projectRoot, "platforms/ios/*/*-Info.plist")
  );

  if (plistMatches.length === 0) {
    throw new Error("ERROR: Could not find IOS Info.plist");
  }

  const plistPath = plistMatches[0];
  const plistXml = await fs.readFile(plistPath, "utf8");
  const plistDocument = libxml.parseXmlString(plistXml);

  plistDocument
    .get("//key[.='CFBundleShortVersionString']/following-sibling::string")
    .text(version);

  plistDocument
    .get("//key[.='CFBundleVersion']/following-sibling::string")
    .text(getTrimmedVersion(version));

  return fs.writeFile(plistPath, plistDocument.toString());
}

module.exports = async (context) => {
  const { projectRoot, platforms } = context.opts;

  const { version } = require(path.join(projectRoot, "package.json"));

  const pending = platforms.map(async (platform) => {
    if (platform === "electron") {
      return Promise.all([
        updateElectronConfig(projectRoot, version, "config.xml"),
        updateElectronConfig(projectRoot, version, "www/config.xml"),
        updateElectronPackageJson(projectRoot, version),
        updateElectronMainScript(projectRoot),
      ]);
    }

    if (platform === "android") {
      return updateAndroidManifest(projectRoot, version);
    }

    if (platform === "ios") {
      return Promise.all([
        updateIOSConfig(projectRoot, version),
        updateIOSPlist(projectRoot, version),
      ]);
    }
  });

  await Promise.all(pending);
};
