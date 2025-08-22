#!/bin/bash

# Build and prepare the Mock Server for service deployment

set -e

echo "🏗️  Building Mock Server for Production Service..."
echo

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "next.config.ts" ]]; then
    echo "❌ Error: Not in Mock Server directory. Please run from the project root."
    echo "Looking for: package.json and next.config.ts"
    echo "Current directory: $(pwd)"
    echo "Files found: $(ls *.json *.ts 2>/dev/null || echo 'none')"
    exit 1
fi

echo "📦 Installing production dependencies..."
npm ci --omit=dev

echo "🔨 Building Next.js application..."
npm run build

echo "📋 Preparing service files..."
chmod +x service.sh
chmod +x server.js

# Update the plist file with correct paths
echo "🔧 Updating service configuration with current paths..."
CURRENT_DIR=$(pwd)
NODE_PATH=$(which node)

# Update plist with actual paths
sed -i.bak "s|/opt/homebrew/bin/node|${NODE_PATH}|g" com.mockserver.service.plist
sed -i.bak "s|/Library/www/sites/mock-server|${CURRENT_DIR}|g" com.mockserver.service.plist

echo "✅ Build completed successfully!"
echo
echo "📊 Build Information:"
echo "   → Project Directory: ${CURRENT_DIR}"
echo "   → Node.js Path: ${NODE_PATH}"
echo "   → Service Config: com.mockserver.service.plist"
echo "   → Server Script: server.js"
echo "   → Management Script: service.sh"
echo
echo "🚀 Next Steps:"
echo "   1. Install service: sudo ./service.sh install"
echo "   2. Check status: sudo ./service.sh status"
echo "   3. View logs: ./service.sh logs"
echo
echo "⚠️  Note: The service will run with root privileges to enable:"
echo "   → Automatic DNS cache flushing"
echo "   → System-level network configuration"
echo "   → SSL certificate management"
