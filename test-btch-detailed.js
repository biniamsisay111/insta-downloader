const { igdl } = require('btch-downloader');

async function testDetailed() {
    console.log('🧪 Testing btch-downloader (igdl) - accessing properties directly...\n');

    try {
        const url = 'https://www.instagram.com/reel/C2kQxZJPxYz/';
        const result = await igdl(url);

        console.log('Status:', result.status);
        console.log('Result array length:', result.result?.length);

        if (result.result && Array.isArray(result.result) && result.result.length > 0) {
            console.log('\n=== Checking first item ===');
            const firstItem = result.result[0];

            console.log('First item:', firstItem);
            console.log('First item.url:', firstItem.url);
            console.log('First item.thumbnail:', firstItem.thumbnail);
            console.log('Type of url:', typeof firstItem.url);
            console.log('URL length:', firstItem.url?.length);

            if (firstItem.url) {
                console.log('\n✅ Found video URL!');
                console.log('URL:', firstItem.url.substring(0, 150) + '...');
                console.log('Thumbnail:', firstItem.thumbnail?.substring(0, 100) + '...');
            }

            // Check a few more items
            console.log('\n=== Checking all items for video URLs ===');
            for (let i = 0; i < Math.min(5, result.result.length); i++) {
                const item = result.result[i];
                if (item.url && item.url.includes('.mp4')) {
                    console.log(`Item ${i} has MP4 URL:`, item.url.substring(0, 100) + '...');
                } else if (item.url) {
                    console.log(`Item ${i} has URL (not MP4):`, item.url.substring(0, 100) + '...');
                }
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testDetailed();
