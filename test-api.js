// Test script to verify the Instagram downloader API
const testUrls = [
    {
        url: 'https://www.youtube.com/watch?v=test',
        expected: 'should fail - not Instagram URL',
        shouldFail: true
    },
    {
        url: 'https://www.instagram.com/reel/C2kQxZJPxYz/',
        expected: 'should succeed - valid Instagram Reel',
        shouldFail: false
    }
];

async function testAPI() {
    console.log('🧪 Testing Instagram Reel Downloader API\n');

    for (const test of testUrls) {
        console.log(`\n📝 Testing: ${test.url}`);
        console.log(`Expected: ${test.expected}\n`);

        try {
            const response = await fetch(`http://localhost:3000/api/fetch-reel?url=${encodeURIComponent(test.url)}`);
            const data = await response.json();

            if (test.shouldFail) {
                if (!response.ok && data.error) {
                    console.log('✅ PASS - Got expected error:', data.error);
                } else {
                    console.log('❌ FAIL - Expected error but got success');
                }
            } else {
                if (response.ok && data.video_url) {
                    console.log('✅ PASS - Got video URL:', data.video_url.substring(0, 50) + '...');
                    console.log('   Title:', data.title);
                    console.log('   Thumbnail:', data.thumbnail ? 'Yes' : 'No');
                } else {
                    console.log('❌ FAIL - Expected success but got error:', data.error);
                }
            }
        } catch (error) {
            console.log('❌ ERROR:', error.message);
        }
    }

    console.log('\n✨ Test complete!\n');
}

testAPI();
