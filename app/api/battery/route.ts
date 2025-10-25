import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const BATTERY_DATA_FILE = path.join(process.cwd(), 'data', 'batteries.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(BATTERY_DATA_FILE);
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

async function readBatteryData() {
  try {
    await ensureDataDirectory();
    const data = await readFile(BATTERY_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeBatteryData(data: any[]) {
  await ensureDataDirectory();
  await writeFile(BATTERY_DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readBatteryData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading battery data:', error);
    return NextResponse.json({ error: 'Failed to read battery data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const batteryRecord = await request.json();
    const data = await readBatteryData();
    
    const newRecord = {
      id: `battery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...batteryRecord,
      timestamp: Date.now(),
    };
    
    data.push(newRecord);
    await writeBatteryData(data);
    
    return NextResponse.json(newRecord);
  } catch (error) {
    console.error('Error adding battery record:', error);
    return NextResponse.json({ error: 'Failed to add battery record' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureDataDirectory();
    await writeBatteryData([]);
    return NextResponse.json({ success: true, message: 'All battery records cleared' });
  } catch (error) {
    console.error('Error clearing battery records:', error);
    return NextResponse.json({ error: 'Failed to clear battery records' }, { status: 500 });
  }
}
