#!/usr/bin/env deno run --allow-net --allow-write

/**
 * Deno script to download ICS calendar file from Outlook
 * Downloads the file to /tmp/foo.ics
 * 
 * Usage:
 *   # Use default hardcoded URL
 *   deno run --allow-net --allow-write --allow-env proxy.ts
 * 
 *   # Use custom URL via environment variable
 *   ICS_URL="https://your-calendar-url.com/calendar.ics" deno run --allow-net --allow-write --allow-env proxy.ts
 */

const ICS_URL = Deno.env.get("ICS_URL")!
const OUTPUT_PATH = "/tmp/foo.ics";

async function downloadICSFile(): Promise<void> {
  try {
    // Check if URL was provided via environment variable
    const isEnvUrl = Deno.env.get("ICS_URL") !== undefined;
    console.log(`🔗 ICS URL source: ${isEnvUrl ? 'Environment variable (ICS_URL)' : 'Default hardcoded URL'}`);
    console.log(`📥 Downloading ICS file from: ${ICS_URL}`);
    console.log(`📁 Output path: ${OUTPUT_PATH}`);
    
    // Fetch the ICS file with additional headers that might help with authentication
    const response = await fetch(ICS_URL, {
      headers: {
        // this is the hack here! if we pretend we are a chrome browser, the outlook server will respond with 200 instead of 500.
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'Accept': 'text/calendar,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    
    console.log(`🌐 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // Try to get error details from response body
      const errorText = await response.text().catch(() => 'Unable to read error response');
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}\nResponse body: ${errorText.substring(0, 200)}...`);
    }
    
    // Get the file content as text
    const icsContent = await response.text();
    
    // Validate that we got ICS content
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      console.warn('⚠️  Warning: Response does not appear to be valid ICS format');
    }
    
    // Ensure the output directory exists
    await Deno.mkdir('/tmp', { recursive: true }).catch(() => {}); // /tmp should already exist on macOS
    
    // Write the content to the output file
    await Deno.writeTextFile(OUTPUT_PATH, icsContent);
    
    console.log(`✅ Successfully downloaded ICS file to: ${OUTPUT_PATH}`);
    console.log(`📄 File size: ${icsContent.length} characters`);
    console.log(`🔍 Preview (first 200 chars): ${icsContent.substring(0, 200)}...`);
    
  } catch (error) {
    console.error(`❌ Error downloading ICS file:`, error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the download function
if (import.meta.main) {
  await downloadICSFile();
}
