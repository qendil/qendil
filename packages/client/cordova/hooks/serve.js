/**
 * Changes cordova config file to point to given URL.
 *
 * Usage example:
 *   cordova run android --serve=http://192.168.1.69:3000
 */

/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs");
const xmlToJs = require("xml2js");

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

module.exports = async (context) => {
  const { projectRoot, platforms, options } = context.opts;
  const { serve } = options;

  const pending = platforms.map(async (platform) => {
    const configPath = getPlatformConfigPath(projectRoot, platform);
    const cordovaConfig = fs.readFileSync(configPath, "utf8");
    const configJson = await xmlToJs.parseStringPromise(cordovaConfig);

    if (serve) {
      const url = /^http(s)?:\/\//.test(serve) ? serve : `http://${serve}`;

      configJson.widget.content[0].$.src = url;

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
    }

    if (platform === "android") {
      const manifestPath = path.join(
        "platforms/android/app/src/main/AndroidManifest.xml"
      );
      const manifestXml = fs.readFileSync(manifestPath, "utf8");
      const manifestJson = await xmlToJs.parseStringPromise(manifestXml);

      // Add clause to allow non-https urls to be opened on android devices
      const applicationNode = manifestJson.manifest.application[0];
      if (serve) {
        applicationNode.$["android:usesCleartextTraffic"] = "true";
      } else {
        delete applicationNode.$["android:usesCleartextTraffic"];
      }

      const manifestBuilder = new xmlToJs.Builder();
      const manifestXmlNew = manifestBuilder.buildObject(manifestJson);
      fs.writeFileSync(manifestPath, manifestXmlNew);
    }

    if (platform === "ios") {
      if (serve) {
        configJson.widget["allow-navigation"] = [
          { $: { href: "http://*/*" } },
          { $: { href: "https://*/*" } },
        ];
        configJson.widget.access = [{ $: { origin: "*" } }];
      } else {
        delete configJson.widget["allow-navigation"];
        delete configJson.widget.access;
      }
    }

    const builder = new xmlToJs.Builder();
    const xml = builder.buildObject(configJson);
    fs.writeFileSync(configPath, xml);
  });

  await Promise.all(pending);
};
