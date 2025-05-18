# FreestyleHelper

A bilingual (English/Swedish) web application designed to assist users in practicing freestyle rapping. It generates song structures, rhyme schemes, and rhyming word pairs, presenting them with visual cues for intended line length.

## Project Overview

FreestyleHelper is a tool for freestyle rap practice that:
- Generates various song structures (verse-chorus, 16-bar, etc.)
- Creates rhyme schemes (AABB, ABAB, etc.)
- Provides rhyming words in English and Swedish
- Displays visual guides for line length/syllable count
- Offers a clean, responsive UI for both desktop and mobile use

## Project Structure

```
freestylehelper/
├── api/                   # Backend serverless functions
│   ├── index.js           # Main Express app (serverless entry point)
│   ├── generate_song.js   # Song generation endpoint
│   ├── lyricLogic.js      # Core functionality (structures, rhymes)
│   └── test-swedish-scraper.js # Test utility for Swedish rhyme scraper
├── public/                # Frontend static assets
│   ├── index.html         # Main HTML page
│   ├── style.css          # Styling
│   └── client.js          # Frontend JavaScript
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel deployment configuration
└── README.md              # Project documentation
```

## Architecture

### Backend (API)
- **Node.js with Express**: Structured as serverless functions for Vercel deployment
- **Endpoints**: Primarily `/api/generate_song` (or `/generate_song` on Vercel)
- **Core Logic**: Song structure generation, rhyme scheme creation, rhyme fetching

### Frontend
- **Vanilla HTML/CSS/JavaScript**: No frameworks, keeps things lightweight
- **Responsive Design**: Works on various screen sizes
- **Client-side Rendering**: Makes API calls and dynamically renders the results

### External Services
- **English Rhymes**: Datamuse API (external third-party API)
- **Swedish Rhymes**: Web scraping of www.rimlexikon.se using axios and cheerio

### Deployment
- **Platform**: Vercel
- **Configuration**: Uses Vercel's serverless functions for API endpoints

## Conventions

### Code Style
- ES6+ JavaScript syntax
- Async/await for asynchronous operations
- JSDoc comments for function documentation
- Consistent error handling with informative messages

### Naming Conventions
- camelCase for variables and functions
- PascalCase for constructors or classes
- Descriptive function and variable names

### API Response Format
```json
{
  "status": "success|error",
  "language": "en|sv",
  "song": {
    "name": "Song Structure Name",
    "parts": [
      {
        "type": "Verse|Chorus|Bridge|etc",
        "bars": 8,
        "rhymeScheme": {
          "name": "AABB|ABAB|etc",
          "description": "Description of the scheme",
          "scheme": ["A", "A", "B", "B"]
        },
        "lines": [
          {
            "index": 1,
            "rhymeGroup": "A",
            "seedWord": "original word",
            "rhymeSuggestions": ["word1", "word2", "word3"],
            "visualLength": 7,
            "note": null
          }
        ]
      }
    ]
  }
}
```

## Goals

1. **Educational Tool**: Help users improve their freestyle skills
2. **Bilingual Support**: Support both English and Swedish languages
3. **Visual Guidance**: Provide visual cues for line length/flow
4. **Performance**: Fast response times and lightweight frontend
5. **Accessibility**: Work across devices and screen sizes
6. **Ethical Scraping**: Respectful web scraping with proper identification and caching

## Setup and Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/freestylehelper.git
cd freestylehelper

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Environment Variables
None required for basic functionality. The app uses public APIs and web scraping.

## API Endpoints

### GET /api/generate_song
Generates a song structure with rhyme suggestions.

**Query Parameters:**
- `lang` (required): Language code (`en` for English, `sv` for Swedish)
- `structure` (optional): Specific song structure name
- `scheme` (optional): Specific rhyme scheme name

**Example Request:**
```
GET /api/generate_song?lang=en
```

## Development Rules

### Swedish Rhyme Scraper
- Always include a proper User-Agent header
- Implement caching to reduce load on rimlexikon.se
- Include comprehensive error handling
- Test thoroughly with various Swedish words

### Frontend Development
- Keep the UI clean and intuitive
- Maintain responsive design for all screen sizes
- Focus on performance and minimal dependencies

### API Expansion
- Maintain the established response format
- Document new endpoints or parameters
- Include proper error handling and validation

## Deployment

### To Vercel
```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy
vercel
```

## License

ISC License

---

Created with ❤️ to help freestyle rappers practice their craft. 