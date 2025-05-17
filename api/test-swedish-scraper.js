/**
 * Test script for Swedish rhyme scraper
 * 
 * This script tests the Swedish rhyme scraper with various test cases:
 * - Common Swedish words
 * - Uncommon or rare words
 * - Words with diacritics (åäö)
 * - Misspelled or non-existent words
 * - Edge cases (empty string, numbers, etc.)
 * 
 * Run with: node api/test-swedish-scraper.js
 */

const { getSwedishRhymes } = require('./lyricLogic');

// Test words array
const testWords = [
    // Common words
    { word: 'tid', description: 'Common word (time)' },
    { word: 'dag', description: 'Common word (day)' },
    { word: 'sätt', description: 'Common word with ä (way)' },
    { word: 'kärlek', description: 'Common word with ä (love)' },

    // Words with Swedish characters
    { word: 'åska', description: 'Word with å (thunder)' },
    { word: 'röst', description: 'Word with ö (voice)' },
    { word: 'sjö', description: 'Short word with ö (lake)' },

    // Less common words
    { word: 'krimskrams', description: 'Less common word (trinkets)' },
    { word: 'pergament', description: 'Less common word (parchment)' },

    // Unusual cases
    { word: 'xylofon', description: 'Word with uncommon letter x' },
    { word: 'quiz', description: 'Foreign word' },

    // Words with likely no rhymes
    { word: 'orange', description: 'Word known for having few rhymes' },
    { word: 'måndag', description: 'Weekday (Monday)' },

    // Misspelled or non-existent words
    { word: 'tidx', description: 'Misspelled word' },
    { word: 'gobbledygook', description: 'Non-Swedish word' },

    // Edge cases
    { word: ' tid ', description: 'Word with extra spaces (should be trimmed)' },
    { word: 'TID', description: 'Uppercase word (should be case-insensitive)' },
    { word: '', description: 'Empty string' },
    { word: '123', description: 'Numbers' }
];

// Run tests
async function runTests() {
    console.log('🔍 TESTING SWEDISH RHYME SCRAPER 🔍');
    console.log('====================================');

    let successCount = 0;
    let failCount = 0;

    for (const test of testWords) {
        try {
            console.log(`\nTesting: "${test.word}" (${test.description})`);

            const result = await getSwedishRhymes(test.word);

            // Log the result summary
            if (result.rhymes && result.rhymes.length > 0) {
                console.log(`✅ Found ${result.rhymes.length} rhymes: ${result.rhymes.slice(0, 5).join(', ')}${result.rhymes.length > 5 ? '...' : ''}`);
                successCount++;
            } else {
                console.log(`⚠️ No rhymes found. Note: ${result.note || 'No note provided'}`);
                // Still a success if we get a valid response, even with no rhymes
                successCount++;
            }

            // Check for source (cache hit)
            if (result.source === 'cache') {
                console.log('📦 Result from cache');
            }

        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            failCount++;
        }

        // Small delay between requests to be nice to the server
        if (testWords.indexOf(test) < testWords.length - 1) {
            console.log('Waiting before next request...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Print summary
    console.log('\n====================================');
    console.log(`SUMMARY: ${successCount} successes, ${failCount} failures out of ${testWords.length} tests`);
    console.log('====================================');
}

// Run the tests
runTests().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
}); 