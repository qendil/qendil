import { $ } from "zx";

export async function requestRaw(endpoint, options = {}) {
  const { search = {}, ...requestOptions } = options;
  const token = $.env.GITHUB_TOKEN;

  const url = new URL(endpoint, "https://api.github.com");
  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }

  const headers = {
    "User-Agent": "qendil-scripts",
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
  };

  const verboseState = $.verbose;
  try {
    $.verbose = false;
    return await fetch(url, { headers, ...requestOptions });
  } finally {
    $.verbose = verboseState;
  }
}

export async function request(endpoint, options) {
  const response = await requestRaw(endpoint, options);
  const json = await response.json();

  if (response.status !== 200) {
    throw new Error(`${response.status} ${json.message}`);
  }

  return json;
}

export async function getCompare(repository, base, head) {
  return request(`/repos/${repository}/compare/${base}...${head}`);
}

export async function* pageThrough(endpoint, options) {
  async function* makeRequest(url, pageOptions) {
    const response = await requestRaw(url, {
      ...pageOptions,
      // eslint-disable-next-line camelcase
      per_page: 100,
    });

    const json = await response.json();

    if (response.status !== 200) {
      throw new Error(`${response.status} ${json.message}`);
    }

    yield json;

    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      const links = linkHeader.split(",");
      const nextLink = links.find((link) => link.includes('rel="next"'));
      if (nextLink) {
        const nextUrl = new URL(/<(.*)>/.exec(nextLink)[1]);
        yield* makeRequest(nextUrl.href, options);
      }
    }
  }

  yield* await makeRequest(endpoint, options);
}

export async function getOldestCommit(repository) {
  // Get oldest commit in the base branch
  const response = await requestRaw(
    `/repos/${repository}/commits`,
    // eslint-disable-next-line camelcase
    { per_page: 100 }
  );

  if (response.status !== 200) {
    const json = await response.json();
    throw new Error(`${response.status} ${json.message}`);
  }

  const commitsLinks = response.headers.get("link");
  if (commitsLinks) {
    const links = commitsLinks.split(",");
    const nextLink = links.find((link) => link.includes('rel="last"'));
    if (nextLink) {
      const nextUrl = new URL(/<(.*)>/.exec(nextLink)[1]);
      const lastCommitsPage = await request(nextUrl.href);
      const lastCommit = lastCommitsPage.pop();
      return lastCommit.sha;
    }
  }

  const commits = await response.json();
  const lastCommit = commits.pop();
  return lastCommit.sha;
}

export async function* getPullRequests(repository, search = {}) {
  const pages = pageThrough(`/repos/${repository}/pulls`, { search });

  for await (const page of pages) {
    for (const pullRequest of page) {
      yield pullRequest;
    }
  }
}

export async function* getTags(repository) {
  const pages = pageThrough(`/repos/${repository}/tags`);

  for await (const page of pages) {
    for (const tag of page) {
      yield tag;
    }
  }
}

export async function getCommit(repository, sha) {
  return request(`/repos/${repository}/commits/${sha}`);
}

export async function getDefaultBranch(repository) {
  const { default_branch: branch } = await request(`/repos/${repository}`);
  return branch;
}
