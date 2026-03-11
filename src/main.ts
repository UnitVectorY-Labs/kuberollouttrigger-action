import * as core from '@actions/core'
import { HttpClient } from '@actions/http-client'
import { expandVersionTags } from './version.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const audience = core.getInput('audience', { required: true })
    const url = core.getInput('url', { required: true })
    const image = core.getInput('image', { required: true })
    const tagsInput = core.getInput('tags', { required: true })
    const timeoutSeconds = Number(core.getInput('timeout-seconds') || '10')
    const expandVersions = core.getInput('expand-versions') === 'true'

    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
      throw new Error('timeout-seconds must be a positive number')
    }

    // Parse tags from comma-separated string to array
    let tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    if (tags.length === 0) {
      throw new Error('tags must contain at least one non-empty tag')
    }

    // Expand version tags if requested
    if (expandVersions) {
      tags = expandVersionTags(tags)
    }

    // Validate URL early so failures are explicit before token/request work.
    new URL(url)

    const token = await core.getIDToken(audience)
    const body = JSON.stringify({ image, tags })

    const client = new HttpClient('kuberollouttrigger-action', [], {
      allowRetries: true,
      maxRetries: 2,
      socketTimeout: timeoutSeconds * 1000
    })

    const response = await client.post(url, body, {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })

    const statusCode = response.message.statusCode
    const responseBody = await response.readBody()

    core.info(`POST ${url} -> ${statusCode}`)
    if (responseBody) {
      core.info(responseBody)
    }

    if (!statusCode || statusCode < 200 || statusCode >= 300) {
      throw new Error(`Request failed with status ${statusCode}`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(String(error))
  }
}
