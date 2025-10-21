import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventKey = searchParams.get('eventKey');

  if (!eventKey) {
    return NextResponse.json({ error: 'Missing eventKey parameter' }, { status: 400 });
  }

  try {
    // Try to get webcast data from TBA
    const tbaResponse = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/webcast`, {
      headers: {
        'X-TBA-Auth-Key': process.env.TBA_API_KEY || 'YOUR_TBA_API_KEY',
      },
    });

    if (tbaResponse.ok) {
      const webcastData = await tbaResponse.json();
      if (webcastData && webcastData.length > 0) {
        return NextResponse.json(webcastData);
      }
    }

    // Fallback to default FIRST stream
    return NextResponse.json([{
      type: 'youtube',
      channel: 'FIRSTINSPIRES',
      url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
    }]);
  } catch (error) {
    console.error('Stream API Error:', error);
    // Return fallback even on error
    return NextResponse.json([{
      type: 'youtube',
      channel: 'FIRSTINSPIRES',
      url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
    }]);
  }
}
