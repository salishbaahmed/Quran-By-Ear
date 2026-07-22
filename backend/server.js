require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const DATASET_PATH = process.env.DATASET_PATH || 'B:\\Quran';
const PORT = process.env.PORT || 3000;

// Helper to pad numbers (e.g. 1 -> '001')
const pad3 = (num) => String(num).padStart(3, '0');

// Endpoint to list available reciters by reading the folders in DATASET_PATH
app.get('/api/reciters', (req, res) => {
    try {
        const dirs = fs.readdirSync(DATASET_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        res.json({ reciters: dirs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read dataset directory' });
    }
});

const DATASET_HOST_URL = process.env.DATASET_HOST_URL || 'http://localhost:8080';

// Endpoint to play/stream or fetch an individual Ayah MP3
app.get('/api/audio', (req, res) => {
    const { reciter, surah, ayah } = req.query;
    
    if (!reciter || !surah || !ayah) {
        return res.status(400).json({ error: 'Missing required parameters: reciter, surah, ayah' });
    }

    const filename = `${pad3(surah)}${pad3(ayah)}.mp3`;
    const redirectUrl = `${DATASET_HOST_URL}/${encodeURIComponent(reciter)}/${filename}`;

    // Issue a 302 Redirect to the public dataset host
    res.redirect(302, redirectUrl);
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend server running at http://0.0.0.0:${PORT}`);
        console.log(`Serving dataset from ${DATASET_PATH}`);
    });
}

module.exports = app;
