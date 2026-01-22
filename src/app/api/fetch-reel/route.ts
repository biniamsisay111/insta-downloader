import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
        });

        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        ];

        const context = await browser.newContext({
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            viewport: { width: 1280, height: 720 },
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const page = await context.newPage();

        // Stealth
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        let videoUrl: string | null = null;

        // Intercept network requests for video
        page.on('response', (response) => {
            const respUrl = response.url();
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('video/mp4') || respUrl.includes('.mp4')) {
                if (!videoUrl || respUrl.length < videoUrl.length) {
                    videoUrl = respUrl;
                }
            }
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extraction Logic for Metadata
        const metadata = await page.evaluate(() => {
            let title = 'Instagram Reel';
            let thumbnail = null;

            // Helper to clean JSON strings
            const sanitize = (str: string) => str.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16))).replace(/\\/g, '');

            // 1. Try LD+JSON
            try {
                const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of Array.from(ldJsonScripts)) {
                    const data = JSON.parse(script.textContent || '{}');
                    if (data.name || data.thumbnailUrl) {
                        title = data.name || title;
                        thumbnail = data.thumbnailUrl || thumbnail;
                        break;
                    }
                }
            } catch (e) { }

            // 2. Fallback: Meta Tags
            if (!thumbnail) {
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage) thumbnail = ogImage.getAttribute('content');
            }

            // 3. Fallback: window._sharedData (Regex style via evaluation)
            const html = document.documentElement.innerHTML;
            if (!thumbnail || title === 'Instagram Reel') {
                // Try to find caption
                const captionMatch = html.match(/"caption":"([^"]+)"/) || html.match(/"text":"([^"]+)"/);
                if (captionMatch && captionMatch[1]) {
                    title = sanitize(captionMatch[1]);
                }

                // Try to find display_url
                const thumbMatch = html.match(/"display_url":"([^"]+)"/) || html.match(/"thumbnail_src":"([^"]+)"/) || html.match(/"thumbnail_url":"([^"]+)"/);
                if (thumbMatch && thumbMatch[1] && !thumbnail) {
                    thumbnail = sanitize(thumbMatch[1]);
                }
            }

            // 4. Last resort DOM check for video
            const video = document.querySelector('video');
            const domesticVideo = video ? (video.getAttribute('src') || video.querySelector('source')?.getAttribute('src')) : null;

            // 5. Check display_url specifically in the page source if still null
            if (!thumbnail) {
                const regex = /"display_url"\s*:\s*"([^"]+)"/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    if (match[1].includes('instagram')) {
                        thumbnail = sanitize(match[1]);
                        break;
                    }
                }
            }

            return { title, thumbnail, domesticVideo };
        });

        if (!videoUrl) videoUrl = metadata.domesticVideo;

        await browser.close();

        if (videoUrl) {
            return NextResponse.json({
                video_url: videoUrl,
                title: metadata.title,
                thumbnail: metadata.thumbnail
            });
        } else {
            throw new Error('Video URL not found');
        }
    } catch (error: any) {
        console.error('Scraper Error:', error);
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        return NextResponse.json({ error: 'Failed to extract reel info. Link might be private or blocked.' }, { status: 500 });
    }
}
