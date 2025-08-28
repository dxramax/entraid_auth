#!/bin/bash
set -e

echo "🚀 Starting PrimeGate Auth Portal - Pure Rust Edition"

# Set environment variables with defaults
export PORT=${PORT:-8080}
export RUST_LOG=${RUST_LOG:-info}

# Start the Rust application
echo "🦀 Launching Rust authentication portal on port $PORT"
exec ./primegate-auth-portal