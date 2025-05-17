const express = require('express');
const path = require('path');

// Create Express app
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Middleware for parsing JSON bodies
app.use(express.json());

// Placeholder for main API route
app.get('/api/generate_song', async (req, res) => {
    try {
        // This is just a placeholder - will be implemented in Phase 1
        res.json({
            status: 'success',
            message: 'API endpoint placeholder. Implementation coming soon.'
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
