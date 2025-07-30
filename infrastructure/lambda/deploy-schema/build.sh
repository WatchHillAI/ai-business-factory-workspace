#!/bin/bash

set -e

echo "Building Lambda deployment package..."

# Clean up previous builds
rm -rf dist
rm -f lambda.zip

# Create dist directory
mkdir -p dist

# Copy Lambda function
cp index.js dist/

# Copy schema file
cp ../../database/schemas/business_ideas_schema.sql dist/

# Install production dependencies
cd dist
npm init -y > /dev/null
npm install --production pg@8.11.3 aws-sdk@2.1528.0

# Create deployment package
zip -r ../lambda.zip . > /dev/null

cd ..
echo "Lambda package created: lambda.zip"

# Create layer for pg module (optional, for better cold start performance)
echo "Creating pg layer..."
mkdir -p layer/nodejs
cd layer/nodejs
npm init -y > /dev/null
npm install --production pg@8.11.3
cd ../..
zip -r pg-layer.zip layer > /dev/null
rm -rf layer

echo "Build complete!"
echo "Files created:"
echo "  - lambda.zip (Lambda function package)"
echo "  - pg-layer.zip (pg module layer)"