#!/bin/bash

# HLS Downloader Development Script
# Simple wrapper around pnpm scripts

set -e

echo "🔧 Starting HLS Downloader Development Server..."
echo "📁 Building to: dist/"
echo "🔄 Watching for changes..."
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the development server
pnpm run dev
