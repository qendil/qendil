import { $, os, path, quiet, chalk } from "zx";
import fs from "node:fs/promises";
import readline from "node:readline";
import events from "node:events";

/**
 * Generates a changelog.
 * Requires docker to be installed.
 *
 * @param {object} options - Options to pass to the changelog generator
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async
export function makeChangelog(options) {
  const { uid, gid } = os.userInfo();
  const command = [
    "docker",
    "run",
    "--rm",
    "--user",
    `${uid}:${gid}`,
    "--volume",
    `${$.cwd}:/usr/local/src/your-app`,
    "--volume",
    "/tmp:/tmp",
    "githubchangeloggenerator/github-changelog-generator",
  ];

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue;

    if (value === true) {
      command.push(`--${key}`);
    } else if (value === false) {
      command.push(`--no-${key}`);
    } else if (Array.isArray(value)) {
      command.push(`--${key}=${value.join(",")}`);
    } else if (typeof value === "object") {
      command.push(`--${key}=${JSON.stringify(value)}`);
    } else {
      command.push(`--${key}=${value}`);
    }
  }

  return quiet($`${command}`);
}

/**
 * Reads lines from a stream and calls a callback for each line.
 *
 * @param {ReadableStream} inputStream - Stream to read lines from
 * @param {(line: string) => void} perLineCallback - Callback to call for each line
 * @returns {Promise<void>} - Promise that resolves when the stream is closed
 */
export async function readLines(inputStream, perLineCallback) {
  const lineReader = readline.createInterface({
    input: inputStream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  lineReader.on("line", perLineCallback);

  return events.once(lineReader, "close");
}

/**
 * Generates a changelog for the given package.
 * Requires docker to be installed.
 *
 * @param {string} name - Name of the package to generate the changelog for
 * @param {object} options - Options to pass to the changelog generator
 */
export async function makePackageChangelog(name, options) {
  const {
    labels = [name],
    directory = `packages/${name}/`,
    gitTag,
    githubToken,
    projectNamespace,
    projectName,
    excludeUsernames = ["dermoumi"],
    tagPrefix = name,
  } = options;

  process.stdout.write(
    chalk.blue(`Generating changelog for ${chalk.bold(name)}... `)
  );

  const outputChangelog = path.join(directory, "CHANGELOG.md");
  const futureRelease = gitTag?.startsWith(tagPrefix)
    ? gitTag.split(`${tagPrefix}/`)[1]
    : undefined;

  const outputFile = "/tmp/__changelog";
  await makeChangelog({
    user: projectNamespace,
    project: projectName,
    token: githubToken,
    issues: false,
    verbose: false,
    "include-labels": labels,
    "pr-label": "**Other changes:**",
    "future-release": futureRelease,
    output: outputFile,
  });

  const output = quiet($`cat ${outputFile} | head -n -4`);

  const namesRegex = new RegExp(
    `${excludeUsernames
      .map((u) => `\\(\\[${u}\\]\\(https:\\/\\/github\\.com\\/${u}\\)\\)`)
      .join("|")}$`
  );

  const outFile = await fs.open(outputChangelog, "w");
  try {
    const outStream = outFile.createWriteStream({ encoding: "utf8" });

    await readLines(output.stdout, (line) => {
      outStream.write(`${line.replace(namesRegex, "")}\n`);
    });
  } finally {
    await outFile.close();
  }

  console.log(chalk.green.bold("DONE"));
}
