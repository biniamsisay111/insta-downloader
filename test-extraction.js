const axios = require('axios');

async function testBtchDownloader() {
    console.log('\n🧪 Testing btch-downloader (igdl)...');
    try {
        const { igdl } = require('btch-downloader');
        const result = await igdl('https://www.instagram.com/reel/C2kQxZJPxYz/');
        console.log('✅ btch-downloader (igdl) result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.log('❌ btch-downloader failed:', error.message);
        return null;
    }
}

async function testInstagramUrlDirect() {
    console.log('\n🧪 Testing instagram-url-direct...');
    try {
        const { instagramGetUrl } = require('instagram-url-direct');
        const result = await instagramGetUrl('https://www.instagram.com/reel/C2kQxZJPxYz/');
        console.log('✅ instagram-url-direct result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.log('❌ instagram-url-direct failed:', error.message);
        console.log('Error details:', error);
        return null;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Instagram extraction tests...\n');

    const btchResult = await testBtchDownloader();
    const directResult = await testInstagramUrlDirect();

    console.log('\n📊 Summary:');
    console.log('btch-downloader:', btchResult ? '✅ WORKS' : '❌ FAILED');
    console.log('instagram-url-direct:', directResult ? '✅ WORKS' : '❌ FAILED');

    console.log('\n✨ All tests complete!\n');
}

runAllTests();
