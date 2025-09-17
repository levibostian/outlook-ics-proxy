# ICS Outlook Proxy

Since August/September 2025, sharing my Outlook calendar no longer works. After debugging it a bit, it seems as though the server will respond with 500 unless you are downloading directly from a web browser. This is not useful at all since I want to use a calendar app or service like Google Calendar (any app that *subscribes* to a URL). 

This is a small and simple tool to get around this bug. It's a simple proxy service that works around Outlook's user-agent restrictions by pretending to be a Chrome browser. 

## Features

- **🚀 Real-time Proxying**: Instantly fetches and serves ICS calendar files
- **🔧 User-Agent Spoofing**: Uses Chrome user-agent to bypass Outlook 500 errors
- **� Token Authentication**: Secure access with configurable access tokens
- **�🐳 Docker Ready**: Includes Docker support with multi-stage builds
- **📊 Health Monitoring**: Built-in health check endpoint
- **🔒 Secure**: Runs as non-root user in container
- **📝 Comprehensive Logging**: Detailed request/response logging

## Quick Start

### 1. Prerequisites

- **Docker** this application is setup to run Deno applications in Docker containers
- **ICS Calendar URL** from Outlook or compatible service
- **Access Token** a secure token for authentication (generate a random string)

### 2. Get Your ICS URL

- Go to your Outlook calendar
- Find the "Publish" or "Share" option
- Copy the ICS calendar URL

### 3. Deploy Service

```bash
docker run -p 8000:8000 \
  -e ICS_URL="https://your-calendar-url.com/calendar.ics" \
  -e ACCESS_TOKEN="your-secret-token-here" \
  ghcr.io/levibostian/ics-outlook-proxy:latest
```

### 4. Get a public URL

`cloudflared tunnel` is a great tool. It allows you to expose your local server to the internet securely. Use this URL in your calendar app instead of the Outlook URL.

### 5. Use the Calendar URL

Your calendar application should subscribe to:
```
https://your-public-domain.com/calendar.ics?token=your-secret-token-here
```

**Important**: Make sure to include the `token` query parameter with your secret token, otherwise you'll get a 401 Unauthorized error. 

## Configuration

The service can be configured using environment variables:

- **`ICS_URL`**: The source ICS calendar URL (required)
- **`ACCESS_TOKEN`**: Secret token for authentication (required)
- **`PORT`**: Server port (default: 8000)

## Authentication

The service now requires token-based authentication for accessing calendar data:

- **Endpoint**: `GET /calendar.ics?token=<ACCESS_TOKEN>`
- **Token Validation**: Compares provided token with `ACCESS_TOKEN` environment variable
- **Error Handling**: Returns 401 Unauthorized for missing or invalid tokens

**Security Note**: Generate a strong, random token for the `ACCESS_TOKEN` environment variable. This token will be visible in your calendar application's subscription URL, so treat it as a secret.

## Monitoring

- **Health Check**: `GET /health` (no authentication required)
- **Calendar Access**: `GET /calendar.ics?token=<token>` (requires valid token)
- **Logs**: Detailed request/response logging with timestamps
- **Status**: HTTP status codes and error messages

## Development

While you can build the docker container and run it, running with Deno is going to increase your feedback loop speed.

```bash
ICS_URL="your_ics_calendar_url_here" deno task run
```

### Type Checking

```bash
# Check TypeScript types
deno task check
```

## Usage

### Local Development

```bash
# Set the ICS URL and run
ICS_URL="https://your-calendar-url.com/calendar.ics" deno run --allow-net --allow-env proxy.ts
```

### Docker

#### Build the image:
```bash
docker build -t ics-outlook-proxy .
```

#### Run the container:
```bash
docker run -p 8000:8000 -e ICS_URL="https://your-calendar-url.com/calendar.ics" ics-outlook-proxy
```

