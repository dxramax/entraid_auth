#!/bin/bash

# Load environment variables from .env file for local development
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ .env file not found"
    exit 1
fi

# Build and run the Rust application
echo "🔨 Building Rust application..."
cargo build --release

echo "🚀 Starting PrimeGate Portal locally..."
./target/release/primegate-auth-portal