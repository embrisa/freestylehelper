/**
 * FreestyleHelper Client-Side JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const songOutput = document.getElementById('song-output');
    const languageRadios = document.querySelectorAll('input[name="language"]');

    // Event Listeners
    generateBtn.addEventListener('click', generateSong);

    // Functions
    async function generateSong() {
        // Get selected language
        const selectedLanguage = document.querySelector('input[name="language"]:checked').value;

        // Show loading state
        songOutput.innerHTML = '<p class="placeholder-message">Loading...</p>';

        try {
            // Call the API
            const response = await fetch(`/api/generate_song?lang=${selectedLanguage}`);

            if (!response.ok) {
                throw new Error('Failed to generate song');
            }

            const data = await response.json();

            // Display placeholder message for now (will be replaced with actual content in Phase 2)
            songOutput.innerHTML = `
        <div class="api-response">
          <h3>API Response (Placeholder)</h3>
          <pre>${JSON.stringify(data, null, 2)}</pre>
          <p>Full implementation coming in Phase 2</p>
        </div>
      `;

        } catch (error) {
            console.error('Error generating song:', error);
            songOutput.innerHTML = `
        <div class="error-message">
          <p>Something went wrong. Please try again.</p>
        </div>
      `;
        }
    }
});
