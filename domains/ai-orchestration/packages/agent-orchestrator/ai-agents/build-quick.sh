#!/bin/bash
# Quick build without type checking for deployment

echo "Quick build for deployment..."

# Clean dist
rm -rf dist

# Use babel or tsc with transpileOnly
npx tsc --noEmit false --skipLibCheck true --noResolve true || true

# If tsc fails, try esbuild as fallback
if [ ! -d "dist" ]; then
  echo "Using esbuild as fallback..."
  npx esbuild src/**/*.ts --outdir=dist --platform=node --format=cjs --target=node18 || true
fi

echo "Build complete. Check dist/ directory."