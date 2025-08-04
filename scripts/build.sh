#!/bin/bash

# HLS Downloader Build Script
# Simple wrapper around pnpm scripts

set -e

echo "🚀 Building HLS Downloader Extension..."

pnpm run build

echo "✅ Build complete!"
echo "📦 Chrome: extension-chrome.zip"
echo "📦 Firefox: extension-firefox.xpi"
echo "📁 Development: dist/"
