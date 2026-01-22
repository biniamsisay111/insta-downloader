import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || `instareel_${Date.now()}.mp4`;

    if (!videoUrl) {
        return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Support Range headers for high-performance seeking and complete file capture
    const range = request.headers.get('range');

    const headers: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': '*/*',
        'Connection': 'keep-alive',
    };

    if (range) {
        headers['Range'] = range;
    }

    try {
        const response = await fetch(videoUrl, {
            method: 'GET',
            headers,
            next: { revalidate: 0 }, // Disable Next.js caching for this request
        });

        // Support both 200 OK and 206 Partial Content
        if (!response.ok && response.status !== 206) {
            throw new Error(`Instagram CDN Error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'video/mp4';
        const contentLength = response.headers.get('content-length');
        const contentRange = response.headers.get('content-range');

        const responseHeaders: HeadersInit = {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Accept-Ranges': 'bytes',
        };

        if (contentLength) responseHeaders['Content-Length'] = contentLength;
        if (contentRange) responseHeaders['Content-Range'] = contentRange;

        // Use NextResponse with the raw stream (response.body)
        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('Download Proxy Failure:', error);
        return NextResponse.json({
            error: 'DOWNLOAD_PROTOCOL_ERROR: Failed to stream video from source.'
        }, { status: 500 });
    }
}
