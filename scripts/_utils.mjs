import readline from "node:readline";
import events from "node:events";

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
