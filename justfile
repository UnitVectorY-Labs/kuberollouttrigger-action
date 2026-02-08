set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Show available recipes.
default:
  @just --list

# Install dependencies exactly as locked.
install:
  npm ci

# Build the action bundle into dist/.
build-dist:
  npm run build

# Refresh dist/ from a clean dependency install.
update-dist: install build-dist

# Quick local validation for source syntax.
lint:
  npm run lint
