/**
 * Expand a semantic version tag into major, major.minor, and full version tags.
 * Non-semver tags are returned as-is.
 *
 * @param tag - A version tag (e.g., "v1.2.3")
 * @returns An array of expanded tags (e.g., ["v1", "v1.2", "v1.2.3"])
 */
export function expandVersionTag(tag: string): string[] {
  const versionPattern = /^v(\d+)\.(\d+)\.(\d+)$/
  const match = tag.match(versionPattern)

  if (!match) {
    // Not a semantic version tag, return as-is
    return [tag]
  }

  const [, major, minor, patch] = match
  return [`v${major}`, `v${major}.${minor}`, `v${major}.${minor}.${patch}`]
}

/**
 * Expand version tags in an array, removing duplicates while preserving order.
 *
 * @param tags - An array of tags
 * @returns An array of expanded, deduplicated tags
 */
export function expandVersionTags(tags: string[]): string[] {
  const expandedTags: string[] = []
  for (const tag of tags) {
    expandedTags.push(...expandVersionTag(tag))
  }
  // Remove duplicates while preserving order
  return [...new Set(expandedTags)]
}
