#!/usr/bin/env bash
# Quick pre-deploy sanity check.
set -euo pipefail

echo "→ Typecheck"
npx tsc --noEmit

echo "→ Build"
npm run build

echo "✓ Ready to deploy."
