#!/usr/bin/env zx

/**
 * Generates changelog for each package in the project.
 * Uses merged pull requests from the github project and filters them by label.
 *
 * options:
 *  --tag: tag to use for the unreleased changes in the changelog
 *  --token: Github token to perform requests. Env: GITHUB_TOKEN.
 *  --namespace: Github namespace of the project. Default: "qendil".
 *  --project: Github project name. Default: "qendil".
 */

import minimist from "minimist";
import { makePackageChangelog } from "./_utils.mjs";

const argv = minimist(process.argv.slice(3));

const options = {
  gitTag: argv.tag,
  githubToken: argv.token ?? process.env.GITHUB_TOKEN ?? "",
  projectNamespace: argv.namespace ?? "qendil",
  projectName: argv.project ?? "qendil",
};

await makePackageChangelog("client", options);
await makePackageChangelog("workers", options);
