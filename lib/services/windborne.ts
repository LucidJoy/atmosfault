import { db } from '@/database/drizzle';
import { balloon_snapshots } from '@/database/schema';
import { lt } from 'drizzle-orm';
import axios from 'axios';

const WINDBORNE_BASE_URL = 'https://a.windbornesystems.com/treasure';
const BATCH_SIZE = 1000; // Insert 1000 records at a time

interface BalloonData {
  latitude: string;
  longitude: string;
  altitude: string;
  snapshotHour: number;
  arrayIndex: number;
}

/**
 * Fetch balloon data from a specific hour file
 */
async function fetchHourData(hour: number): Promise<number[][]> {
  const hourStr = hour.toString().padStart(2, '0');
  const url = `${WINDBORNE_BASE_URL}/${hourStr}.json`;

  try {
    const response = await axios.get<number[][]>(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch hour ${hour}:`, error);
    throw error;
  }
}

/**
 * Transform raw API data into database records
 */
function transformBalloonData(
  data: number[][],
  snapshotHour: number
): BalloonData[] {
  return data.map((item, index) => ({
    latitude: item[0].toString(),
    longitude: item[1].toString(),
    altitude: item[2].toString(),
    snapshotHour,
    arrayIndex: index,
  }));
}

/**
 * Insert data in batches with conflict handling
 */
async function batchInsert(records: BalloonData[]): Promise<number> {
  let insertedCount = 0;

  // Split into chunks of BATCH_SIZE
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);

    try {
      // Use onConflictDoUpdate to update existing records
      // This handles the unique constraint on (snapshotHour, arrayIndex)
      await db
        .insert(balloon_snapshots)
        .values(chunk)
        .onConflictDoUpdate({
          target: [balloon_snapshots.snapshotHour, balloon_snapshots.arrayIndex],
          set: {
            latitude: balloon_snapshots.latitude,
            longitude: balloon_snapshots.longitude,
            altitude: balloon_snapshots.altitude,
            fetchedAt: new Date(),
          },
        });

      insertedCount += chunk.length;
      console.log(
        `Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} records`
      );
    } catch (error) {
      console.error(`Failed to insert batch at index ${i}:`, error);
      throw error;
    }
  }

  return insertedCount;
}

/**
 * Fetch and store data for a specific hour
 */
export async function fetchAndStoreHour(hour: number): Promise<number> {
  console.log(`Fetching data for hour ${hour}...`);

  // Fetch data from API
  const rawData = await fetchHourData(hour);
  console.log(`Fetched ${rawData.length} balloons for hour ${hour}`);

  // Transform to database format
  const records = transformBalloonData(rawData, hour);

  // Batch insert
  const insertedCount = await batchInsert(records);
  console.log(`Completed hour ${hour}: ${insertedCount} records processed`);

  return insertedCount;
}

/**
 * Fetch and store data for all 24 hours
 */
export async function fetchAndStoreAllHours(): Promise<{
  totalRecords: number;
  hourResults: { hour: number; count: number }[];
}> {
  console.log('Starting full data fetch for all 24 hours...');

  const hourResults: { hour: number; count: number }[] = [];
  let totalRecords = 0;

  for (let hour = 0; hour < 24; hour++) {
    try {
      const count = await fetchAndStoreHour(hour);
      hourResults.push({ hour, count });
      totalRecords += count;
    } catch (error) {
      console.error(`Failed to process hour ${hour}, continuing...`);
      hourResults.push({ hour, count: 0 });
    }
  }

  console.log(`\nCompleted! Total records processed: ${totalRecords}`);
  return { totalRecords, hourResults };
}

/**
 * Cleanup old data - keep only the latest snapshot for each hour/index
 * Or keep data from the last N days
 */
export async function cleanupOldData(daysToKeep: number = 7): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    await db
      .delete(balloon_snapshots)
      .where(lt(balloon_snapshots.fetchedAt, cutoffDate));

    console.log(`Cleaned up old data before ${cutoffDate.toISOString()}`);
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
    throw error;
  }
}
