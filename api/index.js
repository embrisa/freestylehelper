const express = require('express');
const path = require('path');
const {
    generateSongStructure,
    generateRhymeScheme,
    getEnglishRhymes,
    getSwedishRhymes
} = require('./lyricLogic');

// Create Express app
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Middleware for parsing JSON bodies
app.use(express.json());

// Main API route for generating song structure with rhymes
app.get('/api/generate_song', async (req, res) => {
    try {
        const { lang = 'en', structure = null, scheme = null } = req.query;

        // Validate language parameter
        if (lang !== 'en' && lang !== 'sv') {
            return res.status(400).json({
                status: 'error',
                message: 'Language must be "en" (English) or "sv" (Swedish)'
            });
        }

        // 1. Generate song structure
        const songStructure = generateSongStructure(structure);

        // 2. Process each part of the song
        const processedSong = {
            name: songStructure.name,
            parts: []
        };

        for (const part of songStructure.parts) {
            // 3. Generate rhyme scheme for this part
            const rhymeScheme = generateRhymeScheme(part.bars, scheme);

            // 4. Find unique rhyme groups (A, B, C, etc.)
            const uniqueRhymeGroups = [...new Set(rhymeScheme.scheme)];

            // 5. Generate seed words for each unique rhyme group
            const seedWords = lang === 'en'
                ? ['time', 'way', 'day', 'man', 'thing', 'world']
                : ['tid', 'sätt', 'dag', 'man', 'sak', 'värld'];

            // 6. Get rhyming words for each unique rhyme group
            const rhymeDictionary = {};

            for (const rhymeGroup of uniqueRhymeGroups) {
                // Select a random seed word
                const seedWord = seedWords[Math.floor(Math.random() * seedWords.length)];

                // Get rhymes based on language
                const rhymeResult = lang === 'en'
                    ? await getEnglishRhymes(seedWord)
                    : await getSwedishRhymes(seedWord);

                rhymeDictionary[rhymeGroup] = {
                    seedWord: seedWord,
                    rhymes: rhymeResult.rhymes || [],
                    note: rhymeResult.note || null
                };
            }

            // 7. Construct the part with lines, each containing rhyme info and visual cues
            const processedPart = {
                type: part.type,
                bars: part.bars,
                rhymeScheme: {
                    name: rhymeScheme.name,
                    description: rhymeScheme.description,
                    scheme: rhymeScheme.scheme
                },
                lines: []
            };

            // 8. Create each line with rhyme information and visual length
            for (let i = 0; i < part.bars; i++) {
                const rhymeGroup = rhymeScheme.scheme[i];
                const rhymeInfo = rhymeDictionary[rhymeGroup];

                // Generate random visual length between 5-10 (representing desired syllable count)
                const visualLength = Math.floor(Math.random() * 6) + 5;

                processedPart.lines.push({
                    index: i + 1,
                    rhymeGroup,
                    seedWord: rhymeInfo.seedWord,
                    rhymeSuggestions: rhymeInfo.rhymes.slice(0, 5), // Provide up to 5 suggestions
                    visualLength,
                    note: rhymeInfo.note
                });
            }

            processedSong.parts.push(processedPart);
        }

        res.json({
            status: 'success',
            language: lang,
            song: processedSong
        });

    } catch (error) {
        console.error('Error in generate_song endpoint:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless function
module.exports = app;
