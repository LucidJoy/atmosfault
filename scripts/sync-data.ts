#!/usr/bin/env tsx

import {
  fetchAndStoreAllHours,
  fetchAndStoreHour,
  cleanupOldData,
} from "@/lib/services/windborne";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    if (command === "all") {
      console.log("Syncing all 24 hours of balloon data...\n");
      const result = await fetchAndStoreAllHours();
      console.log("\n✓ Sync complete!");
      console.log(`Total records processed: ${result.totalRecords}`);
      console.log("\nBreakdown by hour:");
      result.hourResults.forEach(({ hour, count }) => {
        console.log(
          `  Hour ${hour.toString().padStart(2, "0")}: ${count} records`
        );
      });
    } else if (command === "cleanup") {
      const days = parseInt(args[1]) || 7;
      console.log(`Cleaning up data older than ${days} days...\n`);
      await cleanupOldData(days);
      console.log("✓ Cleanup complete!");
    } else if (command && !isNaN(parseInt(command))) {
      const hour = parseInt(command);
      if (hour < 0 || hour > 23) {
        console.error("Error: Hour must be between 0 and 23");
        process.exit(1);
      }
      console.log(`Syncing hour ${hour}...\n`);
      const count = await fetchAndStoreHour(hour);
      console.log(`\n✓ Sync complete! Processed ${count} records`);
    } else {
      console.log("Usage:");
      console.log("  npm run sync all          - Sync all 24 hours");
      console.log("  npm run sync <hour>       - Sync specific hour (0-23)");
      console.log(
        "  npm run sync cleanup [days] - Cleanup data older than N days (default: 7)"
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("\n✗ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
