#!/bin/bash

# Set the port from environment variable or default to 8080
export PORT=${PORT:-8080}

# Update the application to listen on the correct port
./login-app