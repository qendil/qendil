#!/usr/bin/env zx

import { globby, path } from "zx";
import fs from "node:fs/promises";
import readline from "node:readline";
import events from "node:events";

await fs.mkdir("coverage", { recursive: true });

const files = await globby([
  "**/coverage/lcov.info",
  "!**/node_modules/**",
  "!coverage/lcov.info",
]);

const outFile = await fs.open("coverage/lcov.info", "w");
try {
  const outStream = outFile.createWriteStream({ encoding: "utf8" });

  for (const filepath of files) {
    // Read each file and sequencially write it into the stream
    // Replacing any paths into paths relative to this directory

    const coverageRoot = path.dirname(path.dirname(filepath));
    const relativePath = path.relative(process.cwd(), coverageRoot);

    // eslint-disable-next-line no-await-in-loop
    const file = await fs.open(filepath);
    try {
      const stream = file.createReadStream({ encoding: "utf8" });

      const lineReader = readline.createInterface({
        input: stream,
        crlfDelay: Number.POSITIVE_INFINITY,
      });

      lineReader.on("line", (line) => {
        if (line.startsWith("SF:")) {
          const [, fileName] = line.split("SF:");
          const filePath = path.join(relativePath, fileName);
          outStream.write(`SF:${filePath}\n`);
        } else {
          outStream.write(`${line}\n`);
        }
      });

      // eslint-disable-next-line no-await-in-loop
      await events.once(lineReader, "close");
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await file.close();
    }
  }
} finally {
  await outFile.close();
}
