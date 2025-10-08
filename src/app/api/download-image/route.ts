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
      'User-Agent': 'Mozilla/5.0 (compatible; AlibiApp/1.0)',
    };

    // Don't add authorization header for S3 URLs as they should be pre-signed
    // Only add authorization for backend API URLs that might need it
    if (authToken && url.includes('prod-be.examplesite.jp')) {
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
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    // Determine file extension based on content type
    let extension = 'jpg'; // default
    if (contentType.includes('image/jpeg')) extension = 'jpg';
    else if (contentType.includes('image/png')) extension = 'png';
    else if (contentType.includes('image/webp')) extension = 'webp';
    else if (contentType.includes('image/gif')) extension = 'gif';
    else if (contentType.includes('video/mp4')) extension = 'mp4';
    else if (contentType.includes('video/avi')) extension = 'avi';
    else if (contentType.includes('audio/mpeg')) extension = 'mp3';
    else if (contentType.includes('audio/wav')) extension = 'wav';
    else if (contentType.includes('application/pdf')) extension = 'pdf';
    else if (contentType.includes('application/msword')) extension = 'doc';
    else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) extension = 'docx';
    else if (contentType.includes('application/vnd.ms-excel')) extension = 'xls';
    else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) extension = 'xlsx';
    else if (contentType.includes('application/vnd.ms-powerpoint')) extension = 'ppt';
    else if (contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) extension = 'pptx';

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', `attachment; filename="${title || 'download'}.${extension}"`);

    return new NextResponse(blob, { headers: responseHeaders });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
  }
}