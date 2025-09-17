#!/usr/bin/env deno run --allow-net --allow-env

/**
 * Deno web server that proxies ICS calendar files from Outlook. 
 * 
 * Usage: 
 *   # Use custom URL via environment variable
 *   ICS_URL="https://your-calendar-url.com/calendar.ics" deno run --allow-net --allow-env proxy.ts
 * 
 * Endpoints:
 *   GET /calendar.ics - Downloads and returns the ICS calendar file
 *   GET / - Health check endpoint
 */

const ICS_URL = Deno.env.get("ICS_URL")!
const PORT = parseInt(Deno.env.get("PORT") || "8000");

async function downloadICSFile(): Promise<string> {
  console.log(`📥 Downloading ICS file from: ${ICS_URL}`);
  
  // Fetch the ICS file with Chrome user agent to avoid 500 errors
  const response = await fetch(ICS_URL, {
    headers: {
      // this is the hack here! if we pretend we are a chrome browser, the outlook server will respond with 200 instead of 500.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Accept': 'text/calendar,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });
  
  console.log(`🌐 Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}\nResponse body: ${errorText.substring(0, 200)}...`);
  }
  
  const icsContent = await response.text();
  
  // Validate that we got ICS content
  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    console.warn('⚠️  Warning: Response does not appear to be valid ICS format');
  }
  
  console.log(`✅ Successfully downloaded ICS file (${icsContent.length} characters)`);
  return icsContent;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log(`${new Date().toISOString()} - ${request.method} ${path}`);
  
  try {
    if (path === "/calendar.ics") {
      // Download and return the ICS file
      const icsContent = await downloadICSFile();
      
      return new Response(icsContent, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"calendar.ics\"",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } else {
      // 404 for unknown paths
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  } catch (error) {
    console.error(`❌ Error handling request:`, error instanceof Error ? error.message : String(error));
    
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

// Start the server
if (import.meta.main) {
  console.log(`🚀 Starting ICS Proxy Server on port ${PORT}`);
  console.log(`🔗 ICS URL source: ${Deno.env.get("ICS_URL") ? 'Environment variable (ICS_URL)' : 'None!'}`);
  console.log(`📡 Endpoints:`);  
  console.log(`   GET http://localhost:${PORT}/calendar.ics - Download ICS file`);
  console.log(`\n⏹️  Press Ctrl+C to stop the server\n`);
  
  Deno.serve({ port: PORT }, handleRequest);
}
