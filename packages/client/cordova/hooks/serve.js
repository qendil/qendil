/**
 * Changes cordova config file to point to given URL.
 *
 * Usage example:
 *   cordova run android --serve=http://192.168.1.69:3000
 */

/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs");
const libxml = require("libxmljs");

function getPlatformConfigPath(projectRoot, platform) {
  const platformRoot = path.join(projectRoot, "platforms", platform);

  if (platform === "android") {
    const filepath = path.join(platformRoot, "app/src/main/res/xml/config.xml");

    if (fs.existsSync(filepath)) {
      return filepath;
    }
  }

  if (platform === "ios" || platform === "osx") {
    const cordovaCommon = require("cordova-common");

    try {
      const filepath = path.join(
        platformRoot,
        cordovaCommon.ConfigFile.getIOSProjectname(platformRoot),
        "config.xml"
      );

      if (fs.existsSync(filepath)) {
        return filepath;
      }
    } catch {
      // No ios project
    }
  }

  const defaultFilepath = path.join(platformRoot, "config.xml");
  if (fs.existsSync(defaultFilepath)) {
    return defaultFilepath;
  }

  const glob = require("glob");
  const matches = glob.sync(path.join(platformRoot, "**", "config.xml"));
  if (matches.length > 0) return matches[0];
}

module.exports = (context) => {
  const { projectRoot, platforms, options } = context.opts;
  const { serve } = options;

  if (!serve) return;

  for (const platform of platforms) {
    const configPath = getPlatformConfigPath(projectRoot, platform);
    const cordovaConfig = fs.readFileSync(configPath, "utf8");
    const configDocument = libxml.parseXml(cordovaConfig);

    const url = /^http(s)?:\/\//.test(serve) ? serve : `http://${serve}`;

    configDocument.get("//*[name()='content']").attr("src", url);

    if (platform === "electron") {
      // Update the load URL
      const electronConfigPath = path.join(
        projectRoot,
        "platforms/electron/www/cdv-electron-settings.json"
      );

      const electronJson = require(electronConfigPath);

      electronJson.browserWindowInstance.loadURL.url = url;

      fs.writeFileSync(
        electronConfigPath,
        JSON.stringify(electronJson, undefined, 2),
        "utf8"
      );
    }

    if (platform === "ios") {
      configDocument
        .root()
        .node("allow-navigation")
        .attr("href", "http://*/*")
        .parent()
        .node("allow-navigation")
        .attr("href", "https://*/*")
        .parent()
        .node("access")
        .attr("origin", "*");
    }

    if (platform === "android") {
      const manifestPath = path.join(
        "platforms/android/app/src/main/AndroidManifest.xml"
      );
      const manifestXml = fs.readFileSync(manifestPath, "utf8");
      const manifestDocument = libxml.parseXml(manifestXml);

      // Add clause to allow non-https urls to be opened on android devices
      manifestDocument
        .get("//application")
        .attr("android:usesCleartextTraffic", "true");

      fs.writeFileSync(manifestPath, manifestDocument.toString());
    }

    fs.writeFileSync(configPath, configDocument.toString());
  }
};
