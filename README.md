[![GitHub release](https://img.shields.io/github/release/UnitVectorY-Labs/kuberollouttrigger-action.svg)](https://github.com/UnitVectorY-Labs/kuberollouttrigger-action/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Active](https://img.shields.io/badge/Status-Active-green)](https://guide.unitvectorylabs.com/bestpractices/status/#active)

# kuberollouttrigger-action

Reusable GitHub Action that fetches a GitHub OIDC token and sends a POST request
with payload referencing the image and tags for the purposes of triggering
[kuberollouttrigger](https://github.com/UnitVectorY-Labs/kuberollouttrigger) to
trigger an update of containers in a development environment for the purposes of
continuous deployment.

## Inputs

- `audience` (required): OIDC audience to request a token for.
- `url` (required): Rollout trigger endpoint URL.
- `image` (required): Image name.
- `tags` (required): Image tags (comma-separated, e.g., `dev` or
  `v1.0.0,v1.0,v1,latest`).
- `timeout-seconds` (optional, default `10`): HTTP socket timeout.
- `expand-versions` (optional, default `false`): Automatically expand semantic
  version tags (e.g., `v1.2.3` expands to `v1`, `v1.2`, `v1.2.3`).

## Usage

### Single Tag

```yaml
jobs:
  trigger-rollout:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: unitvectory-labs/kuberollouttrigger-action@v0.1.0
        with:
          audience: ${{ vars.KRT_AUDIENCE }}
          url: ${{ vars.KRT_URL }}
          image: ${{ needs.build-and-push.outputs.image }}
          tags: ${{ needs.build-and-push.outputs.tag }}
```

### Multiple Tags

```yaml
jobs:
  trigger-rollout:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: unitvectory-labs/kuberollouttrigger-action@v0.1.0
        with:
          audience: ${{ vars.KRT_AUDIENCE }}
          url: ${{ vars.KRT_URL }}
          image: ghcr.io/myorg/myapp
          tags: v1.0.0,v1.0,v1,latest
```

### Automatic Version Expansion

The `expand-versions` feature automatically expands semantic version tags (e.g.,
`v1.2.3`) into multiple tags (`v1`, `v1.2`, `v1.2.3`). This is useful when
publishing releases to trigger rollouts for all version tags simultaneously.

```yaml
jobs:
  trigger-rollout:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: unitvectory-labs/kuberollouttrigger-action@v0.1.0
        with:
          audience: ${{ vars.KRT_AUDIENCE }}
          url: ${{ vars.KRT_URL }}
          image: ghcr.io/myorg/myapp
          tags: v1.2.3,latest
          expand-versions: true
```

In this example, `v1.2.3,latest` will be expanded to `v1`, `v1.2`, `v1.2.3`,
`latest` before sending to the rollout trigger.
