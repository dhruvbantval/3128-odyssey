import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventKey = searchParams.get('eventKey');

  try {
    // For now, return mock data since Nexus API integration would require specific setup
    // In a real implementation, you would integrate with the actual Nexus API
    const mockLiveData = {
      eventKey,
      currentMatch: null,
      nextMatch: null,
      isLive: false,
      lastUpdate: Date.now()
    };

    return NextResponse.json(mockLiveData);
  } catch (error) {
    console.error('Nexus API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch live event data' }, { status: 500 });
  }
}
