import { ESLint } from "eslint";

// Ignore files ignored by eslint
const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file))
  );
  const filteredFiles = files.filter((_, index) => !isIgnored[index]);
  return filteredFiles.join(" ");
};

export default {
  "*.{ts,tsx,js,jsx,cjs,mjs}": async (files) => {
    const filesToLint = await removeIgnoredFiles(files);
    return [`eslint --max-warnings=0 ${filesToLint}`];
  },
  "*.{ts,tsx,js,jsx,cjs,mjs,json,css,md,html}": [
    "prettier --write --cache --list-different",
  ],
};
