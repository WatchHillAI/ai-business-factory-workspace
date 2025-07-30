#!/bin/bash

set -e

echo "🔨 Building CRUD Lambda deployment package..."

# Clean up previous builds
rm -rf dist
rm -f lambda.zip

# Create dist directory
mkdir -p dist

# Copy Lambda function
cp index.js dist/
cp package.json dist/

# Install production dependencies
cd dist
npm install --production --silent

# Create deployment package
zip -r ../lambda.zip . > /dev/null

cd ..
echo "✅ Lambda package created: lambda.zip ($(du -h lambda.zip | cut -f1))"

# Verify package contents
echo "📦 Package contents:"
unzip -l lambda.zip | head -10
echo "   ... (showing first 10 files)"

echo ""
echo "🚀 Ready for deployment!"
echo "   - AWS Lambda function: business-ideas-crud"
echo "   - Runtime: Node.js 18.x"
echo "   - Handler: index.handler"
echo "   - VPC: Required for database access"