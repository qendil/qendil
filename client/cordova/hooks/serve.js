/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable unicorn/prefer-module */

const path = require("node:path");
const fs = require("node:fs");
const xmlToJs = require("xml2js");

function getPlatformConfigPath(projectRoot, platform) {
  const platformRoot = path.join(projectRoot, "platforms", platform);

  if (platform === "android") {
    const filepath = path.join(
      platformRoot,
      "app",
      "src",
      "main",
      "res",
      "xml",
      "config.xml"
    );

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
      // console.error("ERR", err);
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
    if (serve) {
      const url = /^http(s)?:\/\//.test(serve) ? serve : `http://${serve}`;

      const configPath = getPlatformConfigPath(projectRoot, platform);
      const cordovaConfig = fs.readFileSync(configPath, "utf8");

      const json = await xmlToJs.parseStringPromise(cordovaConfig);

      json.widget.content[0].$.src = url;

      const builder = new xmlToJs.Builder();
      const xml = builder.buildObject(json);
      fs.writeFileSync(configPath, xml);

      if (platform === "electron") {
        const electronConfigPath = path.join(
          projectRoot,
          "platforms",
          "electron",
          "www",
          "cdv-electron-settings.json"
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
  });

  await Promise.all(pending);
};
