import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const BATTERY_DATA_FILE = path.join(process.cwd(), 'data', 'batteries.json');

async function readBatteryData() {
  try {
    const data = await readFile(BATTERY_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeBatteryData(data: any[]) {
  await writeFile(BATTERY_DATA_FILE, JSON.stringify(data, null, 2));
}

export async function PATCH(request: NextRequest) {
  try {
    const { batteryId, status, notes } = await request.json();
    const data = await readBatteryData();
    
    // Find the most recent record for this battery and update it
    const batteryRecords = data.filter((r: any) => r.batteryId === batteryId);
    if (batteryRecords.length > 0) {
      const latestRecord = batteryRecords[batteryRecords.length - 1];
      latestRecord.status = status;
      if (notes) latestRecord.notes = notes;
      latestRecord.timestamp = Date.now();
      
      await writeBatteryData(data);
      return NextResponse.json(latestRecord);
    }
    
    return NextResponse.json({ error: 'Battery not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating battery status:', error);
    return NextResponse.json({ error: 'Failed to update battery status' }, { status: 500 });
  }
}
