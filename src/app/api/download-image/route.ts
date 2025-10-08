import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const title = searchParams.get('title');
  const authToken = searchParams.get('token');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      'Accept': '*/*',
    };

    // Add authorization header for backend API URLs
    if (authToken && (url.includes('prod-be.examplesite.jp') || url.includes('alibi-s3.s3.amazonaws.com'))) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    responseHeaders.set('Content-Disposition', `attachment; filename="${title || 'image'}.jpg"`);

    return new NextResponse(blob, { headers: responseHeaders });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
  }
}