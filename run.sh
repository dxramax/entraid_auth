#!/bin/bash

# Set the port from environment variable
export PORT=${PORT:-8080}

# Make sure the binary is executable
chmod +x ./login-app

# Run the application
exec ./login-app