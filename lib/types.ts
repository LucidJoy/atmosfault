export interface Balloons {
  id: string;
  latitude: number; // from array[0]
  longitude: number; // from array[1]
  altitude: number; // from array[2], in km
  snapshotHour: number; // 0-23
  arrayIndex: number; // position in array
  fetchedAt: Date;
}

export * from './types/tracking';
