/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { HttpClient, mockPost } from '../__fixtures__/http-client.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/http-client', () => ({ HttpClient }))

// The module being tested should be imported dynamically to use the mocks.
const { run } = await import('../src/main.js')

describe('run', () => {
  beforeEach(() => {
    // Default happy-path inputs
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'audience':
          return 'my-audience'
        case 'url':
          return 'https://example.com/webhook'
        case 'image':
          return 'my-image'
        case 'tags':
          return 'latest'
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'false'
        default:
          return ''
      }
    })

    core.getIDToken.mockResolvedValue('mock-token')

    HttpClient.mockImplementation(() => ({
      post: mockPost
    }))

    mockPost.mockResolvedValue({
      message: { statusCode: 200 },
      readBody: () => Promise.resolve('OK')
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('successfully posts to the webhook', async () => {
    await run()

    expect(HttpClient).toHaveBeenCalledWith('kuberollouttrigger-action', [], {
      allowRetries: true,
      maxRetries: 2,
      socketTimeout: 10000
    })

    expect(mockPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      JSON.stringify({ image: 'my-image', tags: ['latest'] }),
      {
        Authorization: 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    )

    expect(core.info).toHaveBeenCalledWith(
      'POST https://example.com/webhook -> 200'
    )
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('expands version tags when expand-versions is true', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'audience':
          return 'my-audience'
        case 'url':
          return 'https://example.com/webhook'
        case 'image':
          return 'my-image'
        case 'tags':
          return 'v1.2.3'
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'true'
        default:
          return ''
      }
    })

    await run()

    expect(mockPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      JSON.stringify({ image: 'my-image', tags: ['v1', 'v1.2', 'v1.2.3'] }),
      expect.any(Object)
    )
  })

  it('fails when timeout-seconds is invalid', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'timeout-seconds':
          return 'invalid'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'timeout-seconds must be a positive number'
    )
  })

  it('fails when timeout-seconds is zero', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'timeout-seconds':
          return '0'
        case 'tags':
          return 'latest'
        case 'expand-versions':
          return 'false'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'timeout-seconds must be a positive number'
    )
  })

  it('fails when timeout-seconds is negative', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'timeout-seconds':
          return '-5'
        case 'tags':
          return 'latest'
        case 'expand-versions':
          return 'false'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'timeout-seconds must be a positive number'
    )
  })

  it('fails when tags is empty', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'tags':
          return ''
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'false'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'tags must contain at least one non-empty tag'
    )
  })

  it('fails when tags contains only whitespace', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'tags':
          return '  ,  ,  '
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'false'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'tags must contain at least one non-empty tag'
    )
  })

  it('fails when URL is invalid', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'url':
          return 'not-a-url'
        case 'tags':
          return 'latest'
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'false'
        default:
          return 'value'
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalled()
  })

  it('fails on non-2xx response', async () => {
    mockPost.mockResolvedValue({
      message: { statusCode: 500 },
      readBody: () => Promise.resolve('Internal Server Error')
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Request failed with status 500'
    )
  })

  it('fails on 404 response', async () => {
    mockPost.mockResolvedValue({
      message: { statusCode: 404 },
      readBody: () => Promise.resolve('Not Found')
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Request failed with status 404'
    )
  })

  it('uses custom timeout', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'audience':
          return 'my-audience'
        case 'url':
          return 'https://example.com/webhook'
        case 'image':
          return 'my-image'
        case 'tags':
          return 'latest'
        case 'timeout-seconds':
          return '30'
        case 'expand-versions':
          return 'false'
        default:
          return ''
      }
    })

    await run()

    expect(HttpClient).toHaveBeenCalledWith('kuberollouttrigger-action', [], {
      allowRetries: true,
      maxRetries: 2,
      socketTimeout: 30000
    })
  })

  it('handles multiple comma-separated tags', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'audience':
          return 'my-audience'
        case 'url':
          return 'https://example.com/webhook'
        case 'image':
          return 'my-image'
        case 'tags':
          return 'latest, dev, v1.0.0'
        case 'timeout-seconds':
          return '10'
        case 'expand-versions':
          return 'false'
        default:
          return ''
      }
    })

    await run()

    expect(mockPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      JSON.stringify({ image: 'my-image', tags: ['latest', 'dev', 'v1.0.0'] }),
      expect.any(Object)
    )
  })

  it('defaults timeout-seconds to 10 when empty', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'audience':
          return 'my-audience'
        case 'url':
          return 'https://example.com/webhook'
        case 'image':
          return 'my-image'
        case 'tags':
          return 'latest'
        case 'timeout-seconds':
          return ''
        case 'expand-versions':
          return 'false'
        default:
          return ''
      }
    })

    await run()

    expect(HttpClient).toHaveBeenCalledWith('kuberollouttrigger-action', [], {
      allowRetries: true,
      maxRetries: 2,
      socketTimeout: 10000
    })
  })

  it('logs response body when present', async () => {
    mockPost.mockResolvedValue({
      message: { statusCode: 200 },
      readBody: () => Promise.resolve('response body here')
    })

    await run()

    expect(core.info).toHaveBeenCalledWith('response body here')
  })

  it('does not log empty response body', async () => {
    mockPost.mockResolvedValue({
      message: { statusCode: 200 },
      readBody: () => Promise.resolve('')
    })

    await run()

    // info is called once for the status, not for empty body
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      'POST https://example.com/webhook -> 200'
    )
  })

  it('handles non-Error exceptions', async () => {
    core.getIDToken.mockRejectedValue('string error')

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('string error')
  })

  it('fetches OIDC token with correct audience', async () => {
    await run()

    expect(core.getIDToken).toHaveBeenCalledWith('my-audience')
  })
})
