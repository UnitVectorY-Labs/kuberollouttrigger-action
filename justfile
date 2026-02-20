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

# Run the test suite.
test:
  npm run test

# Run ESLint.
lint:
  npm run lint

# Format code with Prettier.
format:
  npm run format:write
