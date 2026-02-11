async function run() {
  let core;
  try {
    core = await import("@actions/core");
    const { HttpClient } = await import("@actions/http-client");

    const audience = core.getInput("audience", { required: true });
    const url = core.getInput("url", { required: true });
    const image = core.getInput("image", { required: true });
    const tagsInput = core.getInput("tags", { required: true });
    const timeoutSeconds = Number(core.getInput("timeout-seconds") || "10");
    const expandVersions = core.getInput("expand-versions") === "true";

    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
      throw new Error("timeout-seconds must be a positive number");
    }

    // Expand version tags if requested (e.g., v1.2.3 -> v1, v1.2, v1.2.3)
    function expandVersionTag(tag) {
      const versionPattern = /^v(\d+)\.(\d+)\.(\d+)$/;
      const match = tag.match(versionPattern);
      
      if (!match) {
        // Not a semantic version tag, return as-is
        return [tag];
      }
      
      const [, major, minor, patch] = match;
      return [
        `v${major}`,
        `v${major}.${minor}`,
        `v${major}.${minor}.${patch}`
      ];
    }

    // Parse tags from comma-separated string to array
    let tags = tagsInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (tags.length === 0) {
      throw new Error("tags must contain at least one non-empty tag");
    }

    // Expand version tags if requested
    if (expandVersions) {
      const expandedTags = [];
      for (const tag of tags) {
        expandedTags.push(...expandVersionTag(tag));
      }
      // Remove duplicates while preserving order
      tags = [...new Set(expandedTags)];
    }

    // Validate URL early so failures are explicit before token/request work.
    new URL(url);

    const token = await core.getIDToken(audience);
    const body = JSON.stringify({ image, tags });

    const client = new HttpClient("kuberollouttrigger-action", [], {
      allowRetries: true,
      maxRetries: 2,
      socketTimeout: timeoutSeconds * 1000
    });

    const response = await client.post(url, body, {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    });

    const statusCode = response.message.statusCode;
    const responseBody = await response.readBody();

    core.info(`POST ${url} -> ${statusCode}`);
    if (responseBody) {
      core.info(responseBody);
    }

    if (!statusCode || statusCode < 200 || statusCode >= 300) {
      throw new Error(`Request failed with status ${statusCode}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (core && typeof core.setFailed === "function") {
      core.setFailed(message);
      return;
    }
    console.error(message);
    process.exitCode = 1;
  }
}

run();
