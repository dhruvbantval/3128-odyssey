import { NextRequest, NextResponse } from 'next/server';

const TBA_API_KEY = process.env.TBA_API_KEY || 'YOUR_TBA_API_KEY';
const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const eventKey = searchParams.get('eventKey');
  const teamNumber = searchParams.get('teamNumber');

  // Validate required parameters
  if (!endpoint || !eventKey) {
    return NextResponse.json({ error: 'Missing required parameters: endpoint and eventKey' }, { status: 400 });
  }

  try {
    let url = '';
    
    switch (endpoint) {
      case 'matches':
        if (teamNumber) {
          url = `${TBA_BASE_URL}/team/frc${teamNumber}/event/${eventKey}/matches`;
        } else {
          url = `${TBA_BASE_URL}/event/${eventKey}/matches`;
        }
        break;
      case 'teams':
        url = `${TBA_BASE_URL}/event/${eventKey}/teams`;
        break;
      case 'rankings':
        url = `${TBA_BASE_URL}/event/${eventKey}/rankings`;
        break;
      case 'event-matches':
        url = `${TBA_BASE_URL}/event/${eventKey}/matches`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'X-TBA-Auth-Key': TBA_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`TBA API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TBA API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from TBA' }, { status: 500 });
  }
}
