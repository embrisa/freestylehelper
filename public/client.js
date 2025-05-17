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

      // Clear the output
      songOutput.innerHTML = '';

      if (data.status === 'success' && data.song) {
        // Create song structure container
        const songContainer = document.createElement('div');
        songContainer.className = 'song-container';

        // Add song title
        const songTitle = document.createElement('h2');
        songTitle.className = 'song-title';
        songTitle.textContent = data.song.name;
        songContainer.appendChild(songTitle);

        // Process each part (verse, chorus, etc.)
        data.song.parts.forEach((part, partIndex) => {
          // Create part container
          const partElement = document.createElement('div');
          partElement.className = 'song-part';

          // Add part header
          const partHeader = document.createElement('h3');
          partHeader.className = 'part-header';
          partHeader.textContent = `${part.type} ${partIndex + 1}`;
          partElement.appendChild(partHeader);

          // Add rhyme scheme info
          const schemeInfo = document.createElement('div');
          schemeInfo.className = 'scheme-info';
          schemeInfo.innerHTML = `<span>Rhyme Scheme: ${part.rhymeScheme.name}</span> <span class="scheme-description">${part.rhymeScheme.description}</span>`;
          partElement.appendChild(schemeInfo);

          // Create lines container
          const linesContainer = document.createElement('div');
          linesContainer.className = 'lines-container';

          // Process each line
          part.lines.forEach(line => {
            // Create line container
            const lineElement = document.createElement('div');
            lineElement.className = 'lyric-line';
            lineElement.dataset.rhymeGroup = line.rhymeGroup;

            // Add line number
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = line.index;
            lineElement.appendChild(lineNumber);

            // Add placeholder for user's freestyle
            const freestyle = document.createElement('div');
            freestyle.className = 'freestyle-placeholder';
            lineElement.appendChild(freestyle);

            // Create visual length indicator
            const lengthBar = document.createElement('div');
            lengthBar.className = 'line-length-bar';
            lengthBar.style.width = `${line.visualLength * 10}%`;
            freestyle.appendChild(lengthBar);

            // Add rhyme suggestions
            const suggestions = document.createElement('div');
            suggestions.className = 'rhyme-suggestions';

            // Create badge for rhyme group
            const rhymeGroupBadge = document.createElement('span');
            rhymeGroupBadge.className = 'rhyme-group-badge';
            rhymeGroupBadge.textContent = line.rhymeGroup;
            suggestions.appendChild(rhymeGroupBadge);

            // Add rhyme words
            if (line.rhymeSuggestions && line.rhymeSuggestions.length > 0) {
              const rhymeList = document.createElement('div');
              rhymeList.className = 'rhyme-list';

              line.rhymeSuggestions.forEach(word => {
                const wordElement = document.createElement('span');
                wordElement.className = 'rhyme-word';
                wordElement.textContent = word;
                rhymeList.appendChild(wordElement);
              });

              suggestions.appendChild(rhymeList);
            } else if (line.note) {
              // If there's a note (e.g. "No perfect rhymes found")
              const noteElement = document.createElement('div');
              noteElement.className = 'rhyme-note';
              noteElement.textContent = line.note;
              suggestions.appendChild(noteElement);
            }

            lineElement.appendChild(suggestions);
            linesContainer.appendChild(lineElement);
          });

          partElement.appendChild(linesContainer);
          songContainer.appendChild(partElement);
        });

        songOutput.appendChild(songContainer);

        // Add color coding to rhyme groups
        colorCodeRhymeGroups();
      } else {
        songOutput.innerHTML = `
                    <div class="error-message">
                        <p>Failed to generate song structure. ${data.message || ''}</p>
                    </div>
                `;
      }
    } catch (error) {
      console.error('Error generating song:', error);
      songOutput.innerHTML = `
                <div class="error-message">
                    <p>Something went wrong. Please try again.</p>
                </div>
            `;
    }
  }

  // Function to color code the rhyme groups
  function colorCodeRhymeGroups() {
    // Get all unique rhyme groups
    const allLines = document.querySelectorAll('.lyric-line');
    const rhymeGroups = new Set();

    allLines.forEach(line => {
      rhymeGroups.add(line.dataset.rhymeGroup);
    });

    // Define a set of colors for rhyme groups
    const colors = [
      '#ffadad', '#ffd6a5', '#fdffb6',
      '#caffbf', '#9bf6ff', '#a0c4ff',
      '#bdb2ff', '#ffc6ff', '#ffd6d6',
      '#e2ffcb'
    ];

    // Assign colors to rhyme groups
    const colorMap = {};
    let colorIndex = 0;

    rhymeGroups.forEach(group => {
      colorMap[group] = colors[colorIndex % colors.length];
      colorIndex++;
    });

    // Apply colors to lines and badges
    allLines.forEach(line => {
      const group = line.dataset.rhymeGroup;
      const color = colorMap[group];

      // Color the rhyme group badge
      const badge = line.querySelector('.rhyme-group-badge');
      if (badge) {
        badge.style.backgroundColor = color;
      }

      // Add a subtle left border to the line with the rhyme color
      line.style.borderLeft = `4px solid ${color}`;
    });
  }
});
