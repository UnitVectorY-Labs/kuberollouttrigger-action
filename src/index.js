const core = require("@actions/core");

async function run() {
  try {
    const { HttpClient } = await import("@actions/http-client");

    const audience = core.getInput("audience", { required: true });
    const url = core.getInput("url", { required: true });
    const image = core.getInput("image", { required: true });
    const tag = core.getInput("tag", { required: true });
    const timeoutSeconds = Number(core.getInput("timeout-seconds") || "10");

    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
      throw new Error("timeout-seconds must be a positive number");
    }

    // Validate URL early so failures are explicit before token/request work.
    new URL(url);

    const token = await core.getIDToken(audience);
    const body = JSON.stringify({ image, tag });

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
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
