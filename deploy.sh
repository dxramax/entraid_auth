#!/bin/bash

echo "Building Rust application..."
cargo build --release

echo "Creating deployment package..."
mkdir -p deploy
cp target/release/login-app deploy/
cp startup.sh deploy/
cp web.config deploy/
chmod +x deploy/startup.sh
chmod +x deploy/login-app

echo "Deployment package ready in ./deploy/"
echo ""
echo "To deploy to Azure:"
echo "1. Go to Azure Portal"
echo "2. Navigate to App Service: primegate-portal"
echo "3. Go to Deployment Center"
echo "4. Upload the contents of ./deploy/ folder"
echo "5. Or use Azure CLI: az webapp deployment source config-zip --resource-group <rg-name> --name primegate-portal --src deploy.zip"