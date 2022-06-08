/* eslint-disable unicorn/prefer-module */

module.exports = async function (context) {
  const { platforms } = context.opts;
  const { cordova_platforms: platformsApi } =
    context.requireCordovaModule("cordova-lib");

  if (platforms.includes("android")) {
    await platformsApi.getPlatformApi("android").clean();
  }
};
