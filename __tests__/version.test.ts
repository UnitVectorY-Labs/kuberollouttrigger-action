import { expandVersionTag, expandVersionTags } from '../src/version.js'

describe('expandVersionTag', () => {
  it('expands a full semantic version tag', () => {
    expect(expandVersionTag('v1.2.3')).toEqual(['v1', 'v1.2', 'v1.2.3'])
  })

  it('returns non-semver tags as-is', () => {
    expect(expandVersionTag('latest')).toEqual(['latest'])
    expect(expandVersionTag('dev')).toEqual(['dev'])
  })

  it('handles v0.0.0', () => {
    expect(expandVersionTag('v0.0.0')).toEqual(['v0', 'v0.0', 'v0.0.0'])
  })

  it('does not expand partial versions', () => {
    expect(expandVersionTag('v1.2')).toEqual(['v1.2'])
    expect(expandVersionTag('v1')).toEqual(['v1'])
  })

  it('does not expand without v prefix', () => {
    expect(expandVersionTag('1.2.3')).toEqual(['1.2.3'])
  })

  it('handles large version numbers', () => {
    expect(expandVersionTag('v10.20.30')).toEqual([
      'v10',
      'v10.20',
      'v10.20.30'
    ])
  })
})

describe('expandVersionTags', () => {
  it('expands all tags in an array', () => {
    expect(expandVersionTags(['v1.2.3', 'latest'])).toEqual([
      'v1',
      'v1.2',
      'v1.2.3',
      'latest'
    ])
  })

  it('removes duplicates while preserving order', () => {
    expect(expandVersionTags(['v1.2.3', 'v1.2.4'])).toEqual([
      'v1',
      'v1.2',
      'v1.2.3',
      'v1.2.4'
    ])
  })

  it('handles empty array', () => {
    expect(expandVersionTags([])).toEqual([])
  })

  it('handles mix of semver and non-semver tags', () => {
    expect(expandVersionTags(['v1.0.0', 'latest', 'dev'])).toEqual([
      'v1',
      'v1.0',
      'v1.0.0',
      'latest',
      'dev'
    ])
  })

  it('deduplicates when same major/minor from different patches', () => {
    expect(expandVersionTags(['v1.0.0', 'v1.0.1'])).toEqual([
      'v1',
      'v1.0',
      'v1.0.0',
      'v1.0.1'
    ])
  })
})
