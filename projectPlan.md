**Project Name:** FreestyleHelper

**Core Idea:** A bilingual (English/Swedish) web application designed to assist users in practicing freestyle rapping. It generates song structures, rhyme schemes, and rhyming word pairs, presenting them with visual cues for intended line length.

**Technology Stack:**

  * **Frontend:** HTML, CSS, Vanilla JavaScript (served from a `public` directory).
  * **Backend:** Node.js with Express.js (structured as a serverless function in an `api` directory for Vercel).
  * **English Rhymes:** Datamuse API.
  * **Swedish Rhymes:** Web scraping `www.rimlexikon.se` using `axios` and `cheerio`.
  * **Deployment:** Vercel.
  * **Version Control:** Git.

-----

**Development Plan (as of May 18, 2025):**

**Phase 0: Project Setup & Foundation (Vercel-Aware)**

1.  **Initialize Project:**
      * Initialize Git: `git init`
      * Initialize Node.js project: `npm init -y`
2.  **Install Dependencies:**
      * Express.js: `npm install express`
      * For API calls and scraping: `npm install axios cheerio`
      * Development (optional but recommended): `npm install --save-dev nodemon`
      * Vercel CLI (global install recommended): `npm install -g vercel`
3.  **Define Project Structure:**
      * `/` (root)
          * `api/` (for backend serverless function)
              * `index.js` (main Express app file)
              * `lyricLogic.js` (or similar for core generation functions)
          * `public/` (for static frontend files)
              * `index.html`
              * `client.js`
              * `style.css`
          * `package.json`, `package-lock.json`
          * `.gitignore`
          * `vercel.json` (optional, for specific Vercel configurations if needed beyond auto-detection)
4.  **Basic Backend Setup (`api/index.js`):**
      * Set up a minimal Express app that exports the `app` instance for Vercel.
      * Include static file serving for the `public` directory (e.g., using `express.static(path.join(__dirname, '../public'))`).
      * Add a placeholder for the main API route.
      * *Cursor AI Assist:* "Generate a basic `api/index.js` for an Express.js app intended for Vercel serverless deployment, including static serving from a `../public` directory and a placeholder for an API route."
5.  **Version Control:**
      * Create a `.gitignore` file (e.g., for `node_modules/`, `.env`).
      * Make an initial commit.
      * *Cursor AI Assist:* "Generate a standard Node.js `.gitignore` file."

**Phase 1: Core Backend Logic - The Generation Engine (Express.js)**

1.  **Song Structure Generation (`api/lyricLogic.js`):**
      * Develop JavaScript functions to define and return various song structures (e.g., { name: "Verse-Chorus", parts: [{ type: "Verse", bars: 8 }, { type: "Chorus", bars: 4 }] }).
      * Implement logic to randomly select or allow user selection of structures.
      * *Cursor AI Assist:* "Write a JavaScript function that returns a song structure object with parts like 'Verse' and 'Chorus', each having a 'bars' property."
2.  **Rhyme Scheme Generation (`api/lyricLogic.js`):**
      * Create functions to generate common rhyme schemes (AABB, ABAB, etc.) based on the number of lines/bars in a song part.
      * *Cursor AI Assist:* "Create a JavaScript function that takes a number of lines and returns an AABB rhyme scheme as an array of letters (e.g., 4 lines -\> ['A', 'A', 'B', 'B'])."
3.  **Rhyme Pair Generation (English - Datamuse API) (`api/lyricLogic.js`):**
      * Create an `async function getEnglishRhymes(word)`:
          * Uses `axios` to call the Datamuse API: `https://api.datamuse.com/words?rel_rhy=${word}` (or `sl=${word}` for "sounds like").
          * Parses the JSON response and returns an array of rhyming words.
          * Includes error handling.
      * *Cursor AI Assist:* "Write a JavaScript async function `getEnglishRhymes(word)` using `axios` to fetch rhymes from Datamuse API (`rel_rhy`) and return an array of words. Include error handling."
4.  **Rhyme Pair Generation (Swedish - `www.rimlexikon.se` Scraper) (`api/lyricLogic.js`):**
      * Create an `async function getSwedishRhymes(word)`:
          * **URL Construction:** `const targetUrl = \`[https://www.rimlexikon.se/ord/$](https://www.google.com/search?q=https://www.rimlexikon.se/ord/%24){encodeURIComponent(word)}\`;\`
          * **HTML Fetching:** Uses `axios.get(targetUrl, { headers: { 'User-Agent': 'FreestyleHelper/1.0 (yourprojecturl.com)' } })` to fetch HTML.
          * **HTML Parsing:** Uses `cheerio.load(htmlContent)` to parse.
          * **Data Extraction:** Uses the selector `'ol.word-list li'` to find rhyme elements and extracts text: `$(element).text().trim()`.
          * **Caching:** Implement a simple in-memory cache (e.g., a JS object `{ word: [rhymes], timestamp: Date.now() }`) to store results and reduce load on `rimlexikon.se`. Check cache before fetching.
          * Includes robust error handling (network issues, changes in website structure, word not found).
      * *Cursor AI Assist:* "Write a JavaScript async function `getSwedishRhymes(word)` for Node.js. It should: 1. Construct URL for `www.rimlexikon.se/ord/WORD`. 2. Fetch HTML with `axios` (set User-Agent). 3. Parse with `cheerio`. 4. Extract rhymes from `ol.word-list li`. 5. Implement a simple in-memory cache. 6. Return array of rhymes. 7. Include error handling."
5.  **Main API Endpoint (`api/index.js`):**
      * Create an Express route: `app.get('/api/generate_song', async (req, res) => { ... })`.
      * This handler will:
          * Accept `lang` (e.g., 'en' or 'sv') as a query parameter.
          * Optionally accept parameters for desired structure or starting words.
          * Call functions for song structure, rhyme scheme.
          * Based on `lang`, call `getEnglishRhymes` or `getSwedishRhymes` for necessary words.
          * Assemble a JSON response containing the full song structure with parts, lines, rhyme indications, and suggested rhyming words. Each line should also have a 'visual\_length' property (e.g., a number from 5-10).
      * *Cursor AI Assist:* "Create an Express.js GET route `/api/generate_song` in `api/index.js`. It should take a `lang` query param. Based on `lang`, it calls placeholder functions for song structure, rhyme scheme, and either `getEnglishRhymes` or `getSwedishRhymes` (from `lyricLogic.js`). Return a comprehensive JSON object for the song."

**Phase 2: Basic Frontend - Display & Interaction (`public` folder)**

1.  **HTML Structure (`public/index.html`):**
      * Basic page layout.
      * A "Generate Song" button.
      * A language selection mechanism (e.g., dropdown or radio buttons for English/Swedish).
      * A container `div` (e.g., `id="song-output"`) to display the generated song content.
      * Link to `style.css` and `client.js`.
      * *Cursor AI Assist:* "Generate HTML for `public/index.html` with a title 'FreestyleHelper', a language selector (EN/SV), a 'Generate' button, and a `div` with `id='song-output'`. Link `style.css` and `client.js`."
2.  **Client-Side JavaScript (`public/client.js`):**
      * Add event listener to the "Generate Song" button.
      * On click:
          * Get selected language.
          * Use `Workspace` to call the backend `/api/generate_song?lang=<selected_lang>`.
          * Parse the JSON response.
          * Dynamically create and append HTML elements to `#song-output` to display:
              * Song part titles (Verse 1, Chorus).
              * Lines with placeholders for user lyrics.
              * Display provided rhyming words next to appropriate lines.
              * Render visual "empty bars" (e.g., styled `div`s or `span`s) next to each line, with width proportional to the `visual_length` property.
      * *Cursor AI Assist:* "Write JavaScript for `public/client.js`. On button click, it should: 1. Get selected language. 2. Fetch data from `/api/generate_song` with the lang param. 3. Clear previous content in `#song-output`. 4. Iterate through the song structure in the JSON response and display each part, line, rhyme suggestions, and a visual length indicator (e.g., a div with width based on a 'visual\_length' property)."

**Phase 3: Visual Cues & Styling (`public/style.css`)**

1.  **Styling for Line Lengths:**
      * Style the visual length indicators to look like empty bars or a series of dashes.
2.  **Styling for User Input:**
      * Style the areas where users will mentally (or actually type, if extended later) fill in lyrics.
3.  **General Page Appearance:**
      * Apply a clean, user-friendly design. Consider a dark theme often preferred for creative tools.
      * Ensure responsive design for different screen sizes.
      * *Cursor AI Assist:* "Provide CSS for `public/style.css` for a clean, dark-themed layout for FreestyleHelper. Style elements with class `song-part`, `lyric-line`, `rhyme-suggestion`, and `line-length-bar`."

**Phase 4: Swedish Language Support - Scraper Refinement & Robustness**

1.  **Thorough Scraper Testing:**
      * Test `getSwedishRhymes` with a wide variety of Swedish words (common, uncommon, words with multiple rhymes, no rhymes, non-existent words).
      * Analyze `rimlexikon.se`'s behavior for "word not found" scenarios and handle gracefully in the scraper (e.g., by returning an empty array).
2.  **Error Handling & Fallbacks:**
      * Enhance error handling for `axios` requests (timeouts, network errors).
      * Implement logic for what happens if `rimlexikon.se`'s structure changes and the selector `'ol.word-list li'` fails. Could involve logging the error and returning an empty array or a "service temporarily unavailable" message for Swedish rhymes.
3.  **Cache Optimization:**
      * Review the in-memory cache. For Vercel serverless functions, consider if the cache lifespan is appropriate or if an external caching layer (e.g., Vercel KV, Upstash Redis) would be beneficial for higher traffic (likely overkill for an initial version). Stick with in-memory for simplicity first.
4.  **Responsible Scraping Review:**
      * Ensure the User-Agent is set.
      * Confirm that caching is effectively minimizing direct hits to `rimlexikon.se`. The `robots.txt` allows crawling, but responsible use is key.

**Phase 5: Comprehensive Testing & Refinement**

1.  **End-to-End Testing:**
      * Test the full flow for both English and Swedish: select language, generate song, verify structure, rhymes, and visual cues.
2.  **Local Development & Testing with Vercel CLI:**
      * Use `vercel dev` to emulate the Vercel environment locally. This is crucial for testing serverless functions, static file serving, and environment variables.
3.  **Cross-Browser Testing:**
      * Check basic functionality and appearance on major browsers (Chrome, Firefox, Safari, Edge).
4.  **Code Review and Refactoring:**
      * Review JavaScript for both frontend and backend for clarity, efficiency, and best practices.
      * Ensure consistent error handling.
      * *Cursor AI Assist:* "Refactor this Express.js route handler for better readability." or "Can you spot potential issues in this JavaScript snippet for DOM manipulation?"
5.  **Usability Testing (Informal):**
      * Get feedback from a few potential users if possible.

**Phase 6: Deployment to Vercel**

1.  **Prepare for Deployment:**
      * Ensure `package.json` has a correct `main` field (usually `api/index.js` for Vercel to pick up the serverless function) or rely on Vercel's framework detection.
      * Ensure all necessary files are committed to Git.
2.  **Connect to Vercel:**
      * Push your repository to GitHub, GitLab, or Bitbucket.
      * On the Vercel dashboard, create a new project and import it from your Git repository.
3.  **Configure Project Settings (if necessary):**
      * Vercel usually auto-detects Node.js projects well.
      * **Framework Preset:** Should be detected as Node.js or Express.js.
      * **Build Command:** Vercel typically handles this (e.g., `npm install`).
      * **Output Directory:** Vercel handles serving the `public` directory and the `api` functions.
      * **Environment Variables:** If you add any API keys or sensitive configurations (not needed for Datamuse public or current scraper setup, but good to know where this is).
4.  **Deploy:**
      * Vercel will automatically build and deploy your project on pushes to the main branch (or configured production branch).
5.  **Test Deployed Application:**
      * Thoroughly test the live application.
6.  **Custom Domain (Optional):**
      * Configure a custom domain through Vercel settings if desired.

-----

**Ethical Considerations & Disclaimers:**

  * **Web Scraping (`rimlexikon.se`):** While `robots.txt` is permissive, always be mindful of the target website's implicit terms and server load. The current approach (on-demand, single-word lookup with caching) is generally low-impact. If `rimlexikon.se` changes its structure or policies, the Swedish rhyme functionality may break or need to be discontinued.
  * **Datamuse API:** Adhere to any usage guidelines or rate limits if they apply to your usage volume (public API is generally generous for moderate use).

This comprehensive plan should guide you through the development of "FreestyleHelper." Remember to iterate and adapt as you go. Good luck!