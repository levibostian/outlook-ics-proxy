# Builder stage
FROM denoland/deno:2.4.2 AS builder

# Create app directory
WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json ./
COPY deno.lock ./

# Copy source code
COPY proxy.ts ./

# Compile the application to a binary
RUN deno task compile

# Runtime stage
FROM debian:bookworm-slim AS runtime

# Install curl for health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create a non-root user to run our application
RUN groupadd --gid 1001 icsproxyuser \
  && useradd --uid 1001 --gid icsproxyuser --shell /bin/bash --create-home icsproxyuser \
  && chown -R icsproxyuser:icsproxyuser /app

# Copy the compiled binary from builder stage
COPY --from=builder /app/ics-outlook-proxy ./ics-outlook-proxy

# Make binary executable and change ownership
RUN chmod +x ./ics-outlook-proxy && chown icsproxyuser:icsproxyuser ./ics-outlook-proxy

# Switch to non-root user
USER icsproxyuser

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the compiled binary
CMD ["./ics-outlook-proxy"]
