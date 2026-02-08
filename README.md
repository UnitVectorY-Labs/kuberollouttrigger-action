# kuberollouttrigger-action

Reusable GitHub Action that fetches a GitHub OIDC token and sends a POST request
with an `{image, tag}` payload to a rollout trigger endpoint.

## Inputs

- `audience` (required): OIDC audience to request a token for.
- `url` (required): Rollout trigger endpoint URL.
- `image` (required): Image name.
- `tag` (required): Image tag.
- `timeout-seconds` (optional, default `10`): HTTP socket timeout.

## Usage

```yaml
jobs:
  trigger-rollout:
    runs-on: arc-runner-set
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: unitvectory-labs/kuberollouttrigger-action@v1
        with:
          audience: ${{ vars.KRT_AUDIENCE }}
          url: ${{ vars.KRT_URL }}
          image: ${{ needs.build-and-push.outputs.image }}
          tag: ${{ needs.build-and-push.outputs.tag }}
```

## Development

```bash
npm install
npm run build
```

Commit `dist/index.js` as part of releases.
