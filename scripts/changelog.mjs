#!/usr/bin/env zx

/**
 * Generates changelog for each package in the project.
 * Uses merged pull requests from the github project and filters them by label.
 *
 * GITHUB_TOKEN environment variable is required.
 *
 * options:
 *  --release|-t: tag to use for the unreleased changes in the changelog.
 *  --last-only|-l: only include the last tag in the changelog.
 *  --for-prefix|-p: tag prefix to make the changelog for.
 *  --output|-o: output file name,
 *      relative to the package directory if --for-prefix is not set.
 *  --repository: github repository to use, Default: "qendil/qendil".
 */

import fs from "node:fs/promises";
import path from "node:path";

import minimist from "minimist";
import { globby } from "zx";

import * as github from "./_github.mjs";

const argv = minimist(process.argv.slice(3));

const changelogOptions = {
  forPrefix: argv["for-prefix"] ?? argv.p,
  releaseTag: argv.release ?? argv.t,
  lastTagOnly: argv["last-only"] ?? argv.l,
  output: argv.output ?? argv.o ?? "CHANGELOG.md",
  repository: argv.repository ?? "qendil/qendil",
};

async function getClosedPullRequests(repository, context) {
  if (context.pullRequests) return context.pullRequests;

  context.pullRequestsIterator ??= github.getPullRequests(repository, {
    state: "closed",
    head: await context.defaultBranch,
  });

  const pullRequests = [];
  for await (const pullRequest of context.pullRequestsIterator) {
    pullRequests.push(pullRequest);
  }

  context.pullRequests = pullRequests;
  return pullRequests;
}

async function getTags(repository, context) {
  if (context.tags) return context.tags;

  context.tagsIterator ??= github.getTags(repository);

  const tags = [];
  for await (const tag of context.tagsIterator) {
    const commit = await github.request(tag.commit.url);
    tag.date = commit.commit.committer.date;
    tags.push(tag);
  }

  tags.sort((a, b) => new Date(a.date) - new Date(b.date));

  context.tags = tags;
  return tags;
}

async function filterPullRequests(
  excludeUsers,
  onlyLabels,
  excludeLabels,
  context
) {
  const filteredPullRequests = [];
  for (const pullRequest of await context.closedPullRequests) {
    const { user, labels } = pullRequest;

    if (excludeUsers.includes(user.login)) {
      continue;
    }

    if (
      onlyLabels &&
      onlyLabels.length > 0 &&
      !labels.some(({ name }) => onlyLabels.includes(name))
    ) {
      continue;
    }

    if (labels.some(({ name }) => excludeLabels.includes(name))) {
      continue;
    }

    filteredPullRequests.push(pullRequest);
  }

  return filteredPullRequests;
}

async function renderChangelog(tagAssociations, options) {
  const {
    output,
    groups,
    hideUsers,
    releaseName,
    tagPrefix,
    releaseTag,
    repository,
    root,
    lastTagOnly,
  } = options;

  function formatPullRequest(pullRequest) {
    const { number, title, user, html_url: url } = pullRequest;
    const { login: username, html_url: userUrl } = user;

    const authorString = hideUsers.includes(username)
      ? ""
      : ` ([${username}](${userUrl}))`;

    return `- ${title} [\\#${number}](${url})${authorString}`;
  }

  function formatReleaseName(tagName, date) {
    const formattedDate = new Date(date).toISOString().split("T")[0];

    const urlPrefix = `https://github.com/${repository}/tree`;

    if (tagName) {
      return `## [${
        tagName.startsWith(tagPrefix) ? tagName.split(tagPrefix)[1] : tagName
      }](${urlPrefix}/${tagName}) (${formattedDate})`;
    }

    if (releaseName) {
      return `## [${releaseName}](${urlPrefix}/${releaseTag}) (${formattedDate})`;
    }

    return `## [Unreleased](${urlPrefix}/HEAD)`;
  }

  function groupPullRequest(pullRequest, changeGroup) {
    const { labels } = pullRequest;
    const labelNames = new Set(labels.map((label) => label.name));

    let isPullRequestGrouped = false;
    for (const [group, config] of Object.entries(groups)) {
      if (!config.labels.some((label) => labelNames.has(label))) continue;

      changeGroup[group].push(formatPullRequest(pullRequest));
      isPullRequestGrouped = true;
    }

    if (!isPullRequestGrouped) {
      changeGroup.other.push(formatPullRequest(pullRequest));
    }
  }

  const outFile = await fs.open(path.join(root, output), "w");
  try {
    const outStream = outFile.createWriteStream({ encoding: "utf8" });

    // Write header
    if (!lastTagOnly) {
      outStream.write("# Changelog\n");
    }

    // Write releases
    for (const [tagName, tagInfo] of tagAssociations) {
      const { pullRequests, fullChangelog, date } = tagInfo;
      if (pullRequests.length === 0) continue;

      if (!lastTagOnly) {
        // Write tag name
        outStream.write(`\n${formatReleaseName(tagName, date)}\n`);
      }

      if (fullChangelog) {
        outStream.write(`\n[Full Changelog](${fullChangelog})\n`);
      }

      // Aggregate changes
      const changeGroup = Object.fromEntries(
        Object.keys(groups).map((group) => [group, []])
      );

      // Write pull requests
      for (const pullRequest of pullRequests) {
        groupPullRequest(pullRequest, changeGroup);
      }

      // Write groups
      for (const [group, changes] of Object.entries(changeGroup)) {
        if (changes.length === 0) continue;

        outStream.write(`\n${groups[group].title}\n`);

        for (const change of changes) {
          outStream.write(`\n${change}`);
        }

        // Write a final empty line at the end of the section
        outStream.write("\n");
      }
    }
  } finally {
    await outFile.close();
  }
}

async function makePackageChangelog(packageName, options = {}, context = {}) {
  const {
    onlyLabels = [packageName],
    excludeLabels = [],
    forPrefix,
    root = forPrefix ? "." : path.join("packages", packageName),
    releaseTag,
    repository,
    excludeUsers = [],
    hideUsers = ["dermoumi"],
    defaultBranch,
    tagPrefix = `${packageName}/`,
    unreleasedOnly,
    lastTagOnly,
    groups = {
      enhancements: {
        title: "**Implemented enhancements:**",
        labels: ["enhancement"],
      },
      bugfixes: {
        title: "**Fixed bugs:**",
        labels: ["bug"],
      },
      other: {
        title: "**Other changes:**",
        labels: [],
      },
    },
    output = "CHANGELOG.md",
  } = options;

  const releaseName = releaseTag?.startsWith(tagPrefix)
    ? releaseTag.split(tagPrefix)[1]
    : undefined;

  context.oldestCommit ??= github.getOldestCommit(repository);
  context.closedPullRequests ??= getClosedPullRequests(repository, context);
  context.tags ??= getTags(repository, context);
  context.defaultBranch ??=
    defaultBranch ?? github.getDefaultBranch(repository);

  const pullRequestsPromise = filterPullRequests(
    excludeUsers,
    onlyLabels,
    excludeLabels,
    context
  );

  const taggedPullRequests = new Set();

  async function buildTagDependency(tag, previousTag, date) {
    const [compare, pullRequests] = await Promise.all([
      github.getCompare(
        repository,
        previousTag ?? (await context.oldestCommit),
        tag
      ),
      pullRequestsPromise,
    ]);

    const { commits, html_url: compareUrl } = compare;

    const tagCommits = new Set(commits.map((commit) => commit.sha));
    const tagPullRequests = [];
    for (const pullRequest of pullRequests) {
      const { merge_commit_sha: sha, number } = pullRequest;
      if (!tagCommits.has(sha)) continue;

      tagPullRequests.push(pullRequest);
      taggedPullRequests.add(number);
    }

    const tagInfo = {
      fullChangelog: compareUrl,
      pullRequests: tagPullRequests,
      date,
    };

    return [tag, tagInfo];
  }

  // Map each PR to its associated tag
  const pendingAssociations = [];
  let previousTag;
  for (const tag of await context.tags) {
    const { name: tagName, date } = tag;
    if (!tagName.startsWith(tagPrefix)) continue;

    pendingAssociations.unshift(buildTagDependency(tagName, previousTag, date));
    previousTag = tagName;
  }

  const tagAssociations = new Map();
  tagAssociations.set(undefined, undefined);

  const associations = await Promise.all(pendingAssociations);
  if (!unreleasedOnly) {
    for (const [tag, tagInfo] of associations) {
      tagAssociations.set(tag, tagInfo);
      if (lastTagOnly) break;
    }
  }

  // Handle unreleased changes
  if (lastTagOnly) {
    tagAssociations.delete();
  } else {
    const unreleasedPullRequests = [];
    for (const pullRequest of await pullRequestsPromise) {
      const { number } = pullRequest;
      if (taggedPullRequests.has(number)) continue;

      unreleasedPullRequests.push(pullRequest);
    }

    tagAssociations.set(undefined, {
      pullRequests: unreleasedPullRequests,
      fullChangelog: `https://github.com/${repository}/compare/${
        previousTag ?? (await context.oldestCommit)
      }...${releaseName ? releaseTag : "HEAD"}`,
      date: new Date(),
    });
  }

  // Render the changelog
  return renderChangelog(tagAssociations, {
    output,
    groups,
    hideUsers,
    releaseName,
    tagPrefix,
    releaseTag,
    repository,
    root,
    lastTagOnly,
  });
}

// Entrypoint
const { forPrefix: prefix } = changelogOptions;
if (prefix) {
  await makePackageChangelog(prefix, changelogOptions);
} else {
  const packages = await globby(["packages/*"], { onlyDirectories: true });
  const sharedContext = {};
  await Promise.all(
    packages.map(async (packageDirectory) => {
      const packageName = path.basename(packageDirectory);

      return makePackageChangelog(packageName, changelogOptions, sharedContext);
    })
  );
}
