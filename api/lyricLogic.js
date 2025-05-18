/**
 * FreestyleHelper - Core logic for generating song structures, rhymes, and word pairs
 * 
 * This file will contain functions for:
 * - Song structure generation
 * - Rhyme scheme generation
 * - English rhyme generation (using Datamuse API)
 * - Swedish rhyme generation (scraping www.rimlexikon.se)
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Returns a collection of predefined song structures
 */
function getSongStructures() {
    return [
        {
            name: "Verse-Chorus",
            parts: [
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 }
            ]
        },
        {
            name: "Verse-Chorus-Bridge",
            parts: [
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Bridge", bars: 4 },
                { type: "Chorus", bars: 4 }
            ]
        },
        {
            name: "16 Bar Verse",
            parts: [
                { type: "Verse", bars: 16 }
            ]
        },
        {
            name: "Intro-Verse-Outro",
            parts: [
                { type: "Intro", bars: 4 },
                { type: "Verse", bars: 12 },
                { type: "Outro", bars: 4 }
            ]
        },
        {
            name: "Verse-Hook-Verse",
            parts: [
                { type: "Verse", bars: 12 },
                { type: "Hook", bars: 4 },
                { type: "Verse", bars: 12 },
                { type: "Hook", bars: 4 }
            ]
        }
    ];
}

/**
 * Generates a song structure
 * @param {string} structureName - Optional name of the structure to use (random if not specified)
 * @returns {Object} The selected song structure
 */
function generateSongStructure(structureName = null) {
    const structures = getSongStructures();

    if (structureName) {
        const requestedStructure = structures.find(structure =>
            structure.name.toLowerCase() === structureName.toLowerCase());
        if (requestedStructure) {
            return requestedStructure;
        }
    }

    // Select random structure if none specified or specified wasn't found
    const randomIndex = Math.floor(Math.random() * structures.length);
    return structures[randomIndex];
}

/**
 * Returns a collection of predefined rhyme schemes
 */
function getRhymeSchemes() {
    return [
        {
            name: "AABB",
            description: "Simple couplets",
            generator: (lineCount) => {
                const scheme = [];
                let currentChar = 'A';

                for (let i = 0; i < lineCount; i += 2) {
                    scheme.push(currentChar, currentChar);
                    // Move to next letter (A -> B -> C, etc.)
                    currentChar = String.fromCharCode(currentChar.charCodeAt(0) + 1);
                }

                return scheme.slice(0, lineCount);
            }
        },
        {
            name: "ABAB",
            description: "Alternating rhymes",
            generator: (lineCount) => {
                const scheme = [];

                for (let i = 0; i < lineCount; i += 4) {
                    scheme.push('A', 'B', 'A', 'B');
                }

                return scheme.slice(0, lineCount);
            }
        },
        {
            name: "AAAA",
            description: "Same rhyme throughout",
            generator: (lineCount) => Array(lineCount).fill('A')
        },
        {
            name: "ABCB",
            description: "Rhyme on every other line",
            generator: (lineCount) => {
                const scheme = [];
                let nonRhymingChar = 'A';
                let rhymingChar = 'B';

                for (let i = 0; i < lineCount; i += 4) {
                    scheme.push(nonRhymingChar, rhymingChar, nonRhymingChar + '2', rhymingChar);

                    // Move to next letters
                    nonRhymingChar = String.fromCharCode(nonRhymingChar.charCodeAt(0) + 2);
                    rhymingChar = String.fromCharCode(rhymingChar.charCodeAt(0) + 2);
                }

                return scheme.slice(0, lineCount);
            }
        },
        {
            name: "Freestyle",
            description: "Random mix of rhymes",
            generator: (lineCount) => {
                const scheme = [];
                let availableChars = [];
                let nextChar = 'A';

                for (let i = 0; i < lineCount; i++) {
                    // 40% chance of starting a new rhyme pattern
                    if (Math.random() < 0.4 || availableChars.length === 0) {
                        availableChars.push(nextChar);
                        nextChar = String.fromCharCode(nextChar.charCodeAt(0) + 1);
                    }

                    // Randomly select from available rhyme characters
                    const randomIndex = Math.floor(Math.random() * availableChars.length);
                    scheme.push(availableChars[randomIndex]);
                }

                return scheme;
            }
        }
    ];
}

/**
 * Generates a rhyme scheme for a given number of lines
 * @param {number} lineCount - Number of lines to generate a scheme for
 * @param {string} schemeName - Optional name of scheme to use (random if not specified)
 * @returns {Object} The rhyme scheme with name and array of rhyme letters
 */
function generateRhymeScheme(lineCount, schemeName = null) {
    const schemes = getRhymeSchemes();
    let selectedScheme;

    if (schemeName) {
        selectedScheme = schemes.find(scheme =>
            scheme.name.toLowerCase() === schemeName.toLowerCase());
    }

    // If no scheme specified or specified wasn't found, select random scheme
    if (!selectedScheme) {
        const randomIndex = Math.floor(Math.random() * schemes.length);
        selectedScheme = schemes[randomIndex];
    }

    return {
        name: selectedScheme.name,
        description: selectedScheme.description,
        scheme: selectedScheme.generator(lineCount)
    };
}

/**
 * Extended list of seed words for English rhymes
 */
const englishSeedWords = [
    // Original set
    'time', 'way', 'day', 'man', 'thing', 'world',
    // Extended set with common rap themes and varied sounds
    'light', 'night', 'fight', 'right', 'sight',
    'flow', 'know', 'show', 'grow', 'blow',
    'dream', 'team', 'scheme', 'stream', 'beam',
    'mind', 'find', 'kind', 'blind', 'grind',
    'street', 'beat', 'heat', 'feat', 'sweet',
    'play', 'stay', 'may', 'sway', 'pray',
    'soul', 'goal', 'roll', 'toll', 'whole',
    'true', 'blue', 'crew', 'new', 'through',
    'life', 'strife', 'wife', 'knife', 'rife',
    'real', 'feel', 'deal', 'steel', 'heal',
    'game', 'fame', 'name', 'shame', 'flame',
    'heart', 'start', 'part', 'art', 'smart',
    'place', 'space', 'face', 'grace', 'race',
    'fire', 'hire', 'wire', 'tire', 'desire',
    'sky', 'fly', 'try', 'cry', 'why',
    'word', 'heard', 'bird', 'absurd', 'occurred',
    'move', 'prove', 'groove', 'improve', 'remove',
    'power', 'hour', 'tower', 'flower', 'shower',
    'break', 'take', 'make', 'shake', 'wake'
];

/**
 * Extended list of seed words for Swedish rhymes
 */
const swedishSeedWords = [
    // Original set
    'tid', 'sätt', 'dag', 'man', 'sak', 'värld',
    // Extended set with common Swedish words with varied sounds
    'liv', 'vän', 'ord', 'hand', 'plats', 'hem',
    'rum', 'bild', 'kraft', 'ljus', 'mörk', 'eld',
    'tanke', 'känsla', 'gata', 'stad', 'land', 'hav',
    'vatten', 'luft', 'jord', 'sol', 'måne', 'stjärna',
    'väg', 'resa', 'dröm', 'hopp', 'tro', 'kärlek',
    'hjärta', 'själ', 'kropp', 'blod', 'tår', 'skratt',
    'musik', 'dans', 'sång', 'konst', 'bok', 'film',
    'bord', 'stol', 'dörr', 'fönster', 'golv', 'tak',
    'vind', 'regn', 'snö', 'is', 'eld', 'rök',
    'djur', 'fågel', 'fisk', 'träd', 'blad', 'blomma',
    'bil', 'båt', 'tåg', 'flyg', 'resa', 'färd',
    'mat', 'dryck', 'bröd', 'salt', 'socker', 'krydda',
    'vår', 'sommar', 'höst', 'vinter', 'år', 'månad',
    'vecka', 'dag', 'natt', 'morgon', 'kväll', 'stund'
];

/**
 * Get a random seed word based on language
 * @param {string} lang - Language code (en/sv)
 * @returns {string} A random seed word
 */
function getRandomSeedWord(lang = 'en') {
    const seedWords = lang === 'en' ? englishSeedWords : swedishSeedWords;
    return seedWords[Math.floor(Math.random() * seedWords.length)];
}

/**
 * Get rhyming words in English using Datamuse API with enhanced variation
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Array} An array of rhyming words
 */
async function getEnglishRhymes(word, limit = 10) {
    try {
        // Randomly select which type of rhyme/word relationship to use
        const rhymeTypes = [
            { code: 'rel_rhy', description: 'Perfect rhymes' },
            { code: 'rel_nry', description: 'Near rhymes' },
            { code: 'sl', description: 'Sounds like' },
            { code: 'rel_hom', description: 'Homophones' }
        ];

        // 60% chance to use perfect rhymes, 40% chance to use other types
        const selectedType = Math.random() < 0.6 ?
            rhymeTypes[0] :
            rhymeTypes[Math.floor(Math.random() * (rhymeTypes.length - 1)) + 1];

        // Use Datamuse API with the selected relationship type
        const response = await axios.get(`https://api.datamuse.com/words?${selectedType.code}=${encodeURIComponent(word)}&max=${limit * 2}`);

        // Extract just the words from the response
        let rhymes = response.data.map(item => item.word);

        // If we get enough rhymes, return them with info about type
        if (rhymes.length >= 5) {
            // Shuffle the array to get different results each time
            rhymes = shuffleArray(rhymes).slice(0, limit);

            return {
                word,
                rhymes,
                note: selectedType.description
            };
        }

        // If not enough results, try a fallback to perfect rhymes
        if (selectedType.code !== 'rel_rhy') {
            const fallbackResponse = await axios.get(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=${limit}`);
            const fallbackRhymes = fallbackResponse.data.map(item => item.word);

            if (fallbackRhymes.length > 0) {
                return {
                    word,
                    rhymes: shuffleArray(fallbackRhymes).slice(0, limit),
                    note: `${selectedType.description} (with perfect rhyme fallback)`
                };
            }
        }

        // If still not enough, try to get related words instead
        const relatedResponse = await axios.get(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=${limit}`);
        const relatedWords = relatedResponse.data.map(item => item.word);

        if (relatedWords.length > 0) {
            return {
                word,
                rhymes: shuffleArray(relatedWords).slice(0, limit),
                note: "Related words (no rhymes found)"
            };
        }

        // Last fallback for very unusual words
        return {
            word,
            rhymes: [],
            note: "No rhymes or related words found for this term."
        };
    } catch (error) {
        console.error(`Error fetching English rhymes for "${word}":`, error.message);
        return {
            word,
            rhymes: [],
            error: "Failed to fetch rhymes"
        };
    }
}

/**
 * Helper function to shuffle an array (Fisher-Yates algorithm)
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Simple in-memory cache for Swedish rhymes to reduce load on rimlexikon.se
const swedishRhymeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Enhanced Swedish rhyme generation with multiple sources
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Object} Object containing the word and an array of rhyming words
 */
async function getSwedishRhymes(word, limit = 10) {
    // Normalize the word (lowercase, trim spaces)
    const normalizedWord = word.toLowerCase().trim();

    try {
        // Check cache first to reduce load on external services
        if (swedishRhymeCache.has(normalizedWord)) {
            const cachedItem = swedishRhymeCache.get(normalizedWord);
            // Check if cache is still valid
            if (Date.now() - cachedItem.timestamp < CACHE_EXPIRY) {
                return {
                    word: normalizedWord,
                    rhymes: shuffleArray(cachedItem.rhymes).slice(0, limit),
                    source: 'cache'
                };
            } else {
                // Cache expired, remove it
                swedishRhymeCache.delete(normalizedWord);
            }
        }

        // Try to get rhymes from the primary source (rimlexikon.se)
        const primaryRhymes = await fetchSwedishRhymesFromRimlexikon(normalizedWord);

        // Try a second approach: Variations of the word for more options
        const variations = generateSwedishWordVariations(normalizedWord);
        let secondaryRhymes = [];

        // Only try secondary sources if primary source has too few results
        if (primaryRhymes.length < 5 && variations.length > 0) {
            // Try to get rhymes for word variations (pick up to 2 random variations)
            const variationsToTry = shuffleArray(variations).slice(0, 2);
            for (const variation of variationsToTry) {
                if (variation !== normalizedWord) {
                    const variationRhymes = await fetchSwedishRhymesFromRimlexikon(variation);
                    secondaryRhymes = [...secondaryRhymes, ...variationRhymes];
                }
            }
        }

        // Combine results, remove duplicates, and limit
        let combinedRhymes = [...new Set([...primaryRhymes, ...secondaryRhymes])];

        // Remove the original word if it somehow got included
        combinedRhymes = combinedRhymes.filter(rhyme => rhyme !== normalizedWord);

        // Cache the results
        swedishRhymeCache.set(normalizedWord, {
            rhymes: combinedRhymes,
            timestamp: Date.now()
        });

        // If no rhymes found at all, handle gracefully
        if (combinedRhymes.length === 0) {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Inga rim hittades för detta ord." // "No rhymes found for this word" in Swedish
            };
        }

        // Return with a shuffle for more variety each time
        return {
            word: normalizedWord,
            rhymes: shuffleArray(combinedRhymes).slice(0, limit)
        };
    } catch (error) {
        console.error(`Error fetching Swedish rhymes for "${normalizedWord}":`, error.message);

        // More comprehensive error handling with specific messages
        if (error.code === 'ECONNABORTED') {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Timeout vid anslutning till rimordbok." // "Timeout connecting to rhyme dictionary" in Swedish
            };
        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Kunde inte ansluta till rimordbok. Kontrollera din internetanslutning." // "Could not connect to rhyme dictionary. Check your internet connection." in Swedish
            };
        } else if (error.response) {
            // Handle specific HTTP error responses
            if (error.response.status === 404) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "Ordet hittades inte i rimlexikon." // "The word was not found in the rhyme dictionary" in Swedish
                };
            } else if (error.response.status === 429) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "För många förfrågningar till rimordboken. Vänta en stund och försök igen." // "Too many requests to the rhyme dictionary. Wait a moment and try again." in Swedish
                };
            } else if (error.response.status >= 500) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "Rimordboken är tillfälligt otillgänglig. Försök igen senare." // "The rhyme dictionary is temporarily unavailable. Try again later." in Swedish
                };
            }
        }

        // Generic fallback for any other errors
        return {
            word: normalizedWord,
            rhymes: [],
            note: "Kunde inte hämta rim. Försök igen senare." // "Could not fetch rhymes. Try again later." in Swedish
        };
    }
}

/**
 * Fetch Swedish rhymes from rimlexikon.se
 * @param {string} word - The word to find rhymes for
 * @returns {Array} Array of rhyming words
 */
async function fetchSwedishRhymesFromRimlexikon(word) {
    const targetUrl = `https://www.rimlexikon.se/ord/${encodeURIComponent(word)}`;

    // Fetch HTML with a proper User-Agent to identify our application
    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': 'FreestyleHelper/1.0 (https://freestylehelper.vercel.app)',
            'Accept': 'text/html',
            'Accept-Language': 'sv,en;q=0.9'
        },
        timeout: 5000 // 5 second timeout to prevent hanging requests
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract rhymes from word list - using a robust selector pattern
    // First try the expected selector
    let rhymeElements = $('ol.word-list li');

    // If primary selector fails, try fallback selectors
    if (rhymeElements.length === 0) {
        // Try alternative selectors that might exist if site structure changes
        rhymeElements = $('ul.word-list li, div.rhymes li, .rhyme-list li');

        // If still no rhymes found with fallback selectors
        if (rhymeElements.length === 0) {
            // Last resort: try to find any list items that might contain rhymes
            rhymeElements = $('ol li, ul li').filter(function () {
                // Simple heuristic: list items in the main content area
                return $(this).parents('nav, header, footer').length === 0;
            });
        }
    }

    // Extract rhymes
    const rhymes = [];
    rhymeElements.each((index, element) => {
        const rhymeText = $(element).text().trim();
        if (rhymeText && rhymeText !== word) {
            rhymes.push(rhymeText);
        }
    });

    return rhymes;
}

/**
 * Generate variations of Swedish words to find more rhyming options
 * @param {string} word - The original word
 * @returns {Array} Array of word variations
 */
function generateSwedishWordVariations(word) {
    const variations = [];

    // Only process words with 4+ characters
    if (word.length < 4) return variations;

    // Common Swedish word endings for nouns and verbs
    const wordEndings = [
        { ending: 'a', replacement: 'ar' },   // plural indefinite form of en-words
        { ending: 'a', replacement: 'an' },   // definite form of en-words
        { ending: 'e', replacement: 'ar' },   // plural of some en-words
        { ending: 'en', replacement: 'et' },  // switch between en/ett words
        { ending: 'et', replacement: 'en' },  // switch between ett/en words
        { ending: 'ar', replacement: 'arna' }, // definite plural of en-words
        { ending: 'or', replacement: 'orna' }, // definite plural of or-words
        { ending: 'a', replacement: 'ade' },  // past tense of -a verbs
        { ending: 'a', replacement: 'at' },   // supine of -a verbs
    ];

    // Check if the word ends with any of the defined endings
    for (const { ending, replacement } of wordEndings) {
        if (word.endsWith(ending)) {
            const stem = word.slice(0, -ending.length);
            variations.push(stem + replacement);
        }
    }

    // Add common verb tense variations if word is likely a verb
    if (word.endsWith('a')) {
        const stem = word.slice(0, -1);
        variations.push(stem + 'ar');  // present tense
        variations.push(stem + 'ade'); // past tense
        variations.push(stem + 'at');  // supine
    }

    return variations;
}

module.exports = {
    generateSongStructure,
    generateRhymeScheme,
    getEnglishRhymes,
    getSwedishRhymes,
    getRandomSeedWord, // Export the new function for use in API endpoints
    englishSeedWords,
    swedishSeedWords
};
