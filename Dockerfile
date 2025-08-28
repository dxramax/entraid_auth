# Multi-stage build for optimized container size
FROM rust:1.75-slim as builder

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a new empty shell project
WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock ./

# Build dependencies only (this step is cached if dependencies don't change)
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY src ./src

# Build application
RUN cargo build --release

# Runtime stage - minimal image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Create app user for security
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/target/release/primegate-auth-portal /app/primegate-auth-portal

# Set ownership and permissions
RUN chown appuser:appuser /app/primegate-auth-portal && \
    chmod +x /app/primegate-auth-portal

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV RUST_LOG=info
ENV PORT=8080

# Run the application
CMD ["./primegate-auth-portal"]