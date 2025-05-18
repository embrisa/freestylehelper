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
      // Try first with /api prefix (for local development), then without (for Vercel)
      let response;
      try {
        response = await fetch(`/api/generate_song?lang=${selectedLanguage}`);
        if (!response.ok) {
          // If the /api route fails, try the direct route (for Vercel serverless functions)
          const altResponse = await fetch(`/generate_song?lang=${selectedLanguage}`);
          if (altResponse.ok) {
            response = altResponse;
          } else {
            throw new Error('Failed to generate song');
          }
        }
      } catch (error) {
        // Try alternative route if first attempt fails
        try {
          response = await fetch(`/generate_song?lang=${selectedLanguage}`);
          if (!response.ok) {
            throw new Error('Failed to generate song');
          }
        } catch (secondError) {
          throw new Error('Failed to generate song');
        }
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

            // Add text input area that appears when clicking on a rhyme word
            const lyricText = document.createElement('div');
            lyricText.className = 'lyric-text';
            lyricText.contentEditable = true;
            lyricText.setAttribute('placeholder', 'Click a rhyme word to start your line...');
            freestyle.appendChild(lyricText);

            // Make clicking on the freestyle placeholder focus the lyric text
            freestyle.addEventListener('click', () => {
              lyricText.focus();
            });

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

              // Track selected rhyme word for this line
              let selectedRhymeElement = null;

              line.rhymeSuggestions.forEach(word => {
                const wordElement = document.createElement('span');
                wordElement.className = 'rhyme-word';
                wordElement.textContent = word;

                // Add click event to each rhyme word
                wordElement.addEventListener('click', () => {
                  // Clear any previously selected rhyme words in this line
                  if (selectedRhymeElement) {
                    selectedRhymeElement.classList.remove('selected');
                  }

                  // Mark this rhyme word as selected
                  wordElement.classList.add('selected');
                  selectedRhymeElement = wordElement;

                  // Update the lyric text with the selected rhyme word
                  updateLyricWithRhyme(lyricText, word);
                });

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

        // Add button to copy the complete song
        addCopySongButton(songContainer);
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

  // Function to update the lyric text with the selected rhyme word
  function updateLyricWithRhyme(lyricTextElement, rhymeWord) {
    // Make the length bar less visible when text is added
    const parentElement = lyricTextElement.parentElement;
    const lengthBar = parentElement.querySelector('.line-length-bar');
    if (lengthBar) {
      lengthBar.style.opacity = '0.2';
    }

    // If the lyric element is empty, just add the rhyme word
    if (!lyricTextElement.textContent.trim()) {
      lyricTextElement.textContent = rhymeWord;
      // Put cursor at the beginning of the text
      setCaretPosition(lyricTextElement, 0);
    } else {
      // If there's already content, replace the last word with the rhyme word
      const currentText = lyricTextElement.textContent.trim();
      const words = currentText.split(' ');

      // If the last word is already a rhyme word (was previously clicked), replace it
      if (words.length > 0) {
        words.pop(); // Remove the last word
        if (words.length > 0) {
          lyricTextElement.textContent = words.join(' ') + ' ' + rhymeWord;
        } else {
          lyricTextElement.textContent = rhymeWord;
        }
      }
    }

    // Highlight the lyric-text to show it's active
    lyricTextElement.classList.add('active');

    // Focus on the element so user can continue typing
    lyricTextElement.focus();
  }

  // Helper function to set caret position in contentEditable element
  function setCaretPosition(element, position) {
    const range = document.createRange();
    const selection = window.getSelection();

    if (element.childNodes.length > 0) {
      const textNode = element.childNodes[0];
      const positionToUse = Math.min(position, textNode.length);
      range.setStart(textNode, positionToUse);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      element.focus();
    }
  }

  // Function to add a button to copy the complete song
  function addCopySongButton(songContainer) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-song-btn';
    copyButton.textContent = 'Copy Song';
    copyButton.addEventListener('click', () => {
      // Extract all lyric lines
      const songText = extractSongText(songContainer);

      // Copy to clipboard
      navigator.clipboard.writeText(songText)
        .then(() => {
          // Provide visual feedback
          copyButton.textContent = 'Copied!';
          copyButton.classList.add('copied');

          // Reset button after 2 seconds
          setTimeout(() => {
            copyButton.textContent = 'Copy Song';
            copyButton.classList.remove('copied');
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          copyButton.textContent = 'Failed to copy';
          copyButton.classList.add('error');

          // Reset button after 2 seconds
          setTimeout(() => {
            copyButton.textContent = 'Copy Song';
            copyButton.classList.remove('error');
          }, 2000);
        });
    });

    // Add the button at the top of the song container
    songContainer.insertBefore(copyButton, songContainer.firstChild);
  }

  // Function to extract all lyrics from the song
  function extractSongText(songContainer) {
    const parts = songContainer.querySelectorAll('.song-part');
    let songText = '';

    parts.forEach((part, partIndex) => {
      // Add part header
      const partHeader = part.querySelector('.part-header');
      if (partHeader) {
        songText += partHeader.textContent + '\n\n';
      }

      // Add each line
      const lyricLines = part.querySelectorAll('.lyric-text');
      lyricLines.forEach((line, lineIndex) => {
        const lineText = line.textContent.trim();
        if (lineText) {
          songText += lineText + '\n';
        } else {
          songText += '[Empty Line]\n';
        }
      });

      songText += '\n';
    });

    return songText;
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
