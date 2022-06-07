import { fetch } from "zx";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

export async function ensureCodeClimateReporter() {
  const CC_REPORTER_BINARY_URL =
    "https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64";

  // Download codeclimate executable
  const codeClimateBinary = "/tmp/cc-reporter";

  try {
    await fs.access(codeClimateBinary, fsConstants.X_OK);
  } catch {
    const ccDownload = await fetch(CC_REPORTER_BINARY_URL);
    const buffer = await ccDownload.arrayBuffer();
    const ccReporterFile = await fs.open(codeClimateBinary, "w");
    try {
      await ccReporterFile.write(Buffer.from(buffer));
    } finally {
      await ccReporterFile.close();
    }
  }

  // Make file executable
  await fs.chmod(codeClimateBinary, 0o755);

  return codeClimateBinary;
}
