import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Helper function to add random delay (1-3 seconds) to avoid bot detection
const randomDelay = () => {
    const delay = Math.floor(Math.random() * 2000) + 1000; // 1000-3000ms
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Extract shortcode from Instagram URL
function extractShortcode(url: string): string | null {
    const patterns = [
        /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Method 1: Use a public downloader API (instavideosave.net style)
async function tryPublicDownloaderAPI(url: string) {
    try {
        // Using a public Instagram downloader API endpoint
        const apiUrl = 'https://v3.saveig.app/api/ajaxSearch';

        const response = await axios.post(apiUrl,
            `q=${encodeURIComponent(url)}&t=media&lang=en`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://saveig.app',
                    'Referer': 'https://saveig.app/en',
                },
                timeout: 15000
            }
        );

        if (response.data && response.data.data) {
            // Parse the HTML response to extract video URL
            const html = response.data.data;

            // Look for download links
            const videoMatch = html.match(/href="([^"]+)"[^>]*download/i);
            const thumbnailMatch = html.match(/src="([^"]+)"[^>]*class="[^"]*thumb/i);

            if (videoMatch) {
                return {
                    video_url: videoMatch[1],
                    title: 'Instagram Reel',
                    thumbnail: thumbnailMatch ? thumbnailMatch[1] : null
                };
            }
        }
    } catch (error: any) {
        console.log('Public downloader API method failed:', error.message);
    }
    return null;
}

// Method 2: Try direct Instagram page scraping with better parsing
async function tryDirectPageScraping(shortcode: string) {
    try {
        const url = `https://www.instagram.com/p/${shortcode}/`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.instagram.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
            },
            timeout: 15000
        });

        const html = response.data;

        // Try to find video URL in various formats
        const patterns = [
            /"video_url":"([^"]+)"/,
            /"playback_url":"([^"]+)"/,
            /\\"video_url\\":\\"([^"]+)\\"/,
            /"contentUrl":"([^"]+)"/,
            /<meta property="og:video" content="([^"]+)"/,
            /<meta property="og:video:secure_url" content="([^"]+)"/,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                let videoUrl = match[1]
                    .replace(/\\u0026/g, '&')
                    .replace(/\\\//g, '/')
                    .replace(/\\/g, '');

                if (videoUrl && videoUrl.startsWith('http') && videoUrl.includes('.mp4')) {
                    // Try to find thumbnail
                    const thumbnailMatch = html.match(/"display_url":"([^"]+)"/);
                    const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/\\/g, '') : null;

                    return {
                        video_url: videoUrl,
                        title: 'Instagram Reel',
                        thumbnail
                    };
                }
            }
        }
    } catch (error: any) {
        console.log('Direct page scraping failed:', error.message);
    }
    return null;
}

// Method 3: Try using Instagram's embed endpoint
async function tryEmbedEndpoint(shortcode: string) {
    try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html',
                'Referer': 'https://www.instagram.com/',
            },
            timeout: 10000
        });

        const html = response.data;

        // Look for video URL in embed page
        const videoMatch = html.match(/"video_url":"([^"]+)"/);
        if (videoMatch) {
            const videoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            return {
                video_url: videoUrl,
                title: 'Instagram Reel',
                thumbnail: null
            };
        }
    } catch (error: any) {
        console.log('Embed endpoint failed:', error.message);
    }
    return null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    // Validate URL is provided
    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate that the URL is an Instagram URL
    if (!url.includes('instagram.com')) {
        return NextResponse.json({
            error: 'Invalid Link: This is not an Instagram URL.'
        }, { status: 400 });
    }

    // Extract shortcode from URL
    const shortcode = extractShortcode(url);
    if (!shortcode) {
        return NextResponse.json({
            error: 'Invalid Instagram URL format'
        }, { status: 400 });
    }

    console.log('🔄 Processing Instagram URL:', url);
    console.log('📝 Extracted shortcode:', shortcode);

    // Add random delay to avoid bot detection
    console.log('⏳ Adding random delay...');
    await randomDelay();

    // Try multiple methods in sequence
    const methods = [
        { name: 'Public Downloader API', fn: () => tryPublicDownloaderAPI(url) },
        { name: 'Direct Page Scraping', fn: () => tryDirectPageScraping(shortcode) },
        { name: 'Embed Endpoint', fn: () => tryEmbedEndpoint(shortcode) },
    ];

    for (const method of methods) {
        console.log(`🔍 Trying method: ${method.name}...`);
        try {
            const result = await method.fn();

            if (result && result.video_url) {
                console.log(`✅ Success with ${method.name}!`);
                return NextResponse.json(result);
            }
        } catch (error: any) {
            console.log(`❌ ${method.name} failed:`, error.message);
        }
    }

    // If all methods fail
    console.error('❌ All extraction methods failed');
    return NextResponse.json({
        error: 'Failed to extract reel info. This Reel may be private, restricted, or unavailable in your region.'
    }, { status: 500 });
}
