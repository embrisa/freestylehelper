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
 * Get rhyming words in English using Datamuse API
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Array} An array of rhyming words
 */
async function getEnglishRhymes(word, limit = 10) {
    try {
        // Use Datamuse API to get words that rhyme with the input word
        const response = await axios.get(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=${limit}`);

        // Extract just the words from the response
        const rhymes = response.data.map(item => item.word);

        // If no rhymes found, try a "sounds like" query as fallback
        if (rhymes.length === 0) {
            const soundsLikeResponse = await axios.get(`https://api.datamuse.com/words?sl=${encodeURIComponent(word)}&max=${limit}`);
            return {
                word,
                rhymes: soundsLikeResponse.data.map(item => item.word),
                note: "No perfect rhymes found. These words sound similar."
            };
        }

        return {
            word,
            rhymes
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

// Simple in-memory cache for Swedish rhymes to reduce load on rimlexikon.se
const swedishRhymeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get rhyming words in Swedish by scraping rimlexikon.se
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Object} Object containing the word and an array of rhyming words
 */
async function getSwedishRhymes(word, limit = 10) {
    // Normalize the word (lowercase, trim spaces)
    const normalizedWord = word.toLowerCase().trim();

    try {
        // Check cache first to reduce load on rimlexikon.se
        if (swedishRhymeCache.has(normalizedWord)) {
            const cachedItem = swedishRhymeCache.get(normalizedWord);
            // Check if cache is still valid
            if (Date.now() - cachedItem.timestamp < CACHE_EXPIRY) {
                return {
                    word: normalizedWord,
                    rhymes: cachedItem.rhymes.slice(0, limit),
                    source: 'cache'
                };
            } else {
                // Cache expired, remove it
                swedishRhymeCache.delete(normalizedWord);
            }
        }

        // Construct URL for rimlexikon.se
        const targetUrl = `https://www.rimlexikon.se/ord/${encodeURIComponent(normalizedWord)}`;

        // Fetch HTML with a proper User-Agent to identify our application
        // This is considered good practice and more ethical/responsible scraping
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

        // Extract rhymes from word list - using a more robust selector pattern
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
            if (rhymeText && rhymeText !== normalizedWord) {
                rhymes.push(rhymeText);
            }
        });

        // Cache the results
        swedishRhymeCache.set(normalizedWord, {
            rhymes,
            timestamp: Date.now()
        });

        // If no rhymes found, handle gracefully
        if (rhymes.length === 0) {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Inga rim hittades för detta ord." // "No rhymes found for this word" in Swedish
            };
        }

        return {
            word: normalizedWord,
            rhymes: rhymes.slice(0, limit)
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

module.exports = {
    generateSongStructure,
    generateRhymeScheme,
    getEnglishRhymes,
    getSwedishRhymes
};
