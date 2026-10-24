#!/usr/bin/env bash
# The single deployment mechanism, used for every environment.
# Usage: scripts/deploy.sh <environment> <artifact-dir> <target-dir>
set -euo pipefail

environment="$1"
artifact="$2"
target="$3"

version="$(node scripts/verify-artifact.mjs "$artifact")"

rm -rf "$target"
mkdir -p "$target"
cp -R "$artifact/site/." "$target/"

# Configuration is the only thing that differs per environment.
cat > "$target/config.json" <<EOF
{ "environment": "$environment", "version": "$version", "features": {} }
EOF

echo "Deployed $version to $environment ($target)"
