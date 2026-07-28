require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const DATASET_PATH = process.env.DATASET_PATH || 'C:\\Users\\SAA\\Documents\\Quran';
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'quran-by-ear-dev-secret';

// --- Temp dir for ffmpeg ---
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// --- SQLite Database ---
const db = new Database(path.join(__dirname, 'users.db'));
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// --- Helpers ---

// Pad a number to 3 digits: 1 -> '001'
const pad3 = (num) => String(num).padStart(3, '0');

// Format a reciter folder name for display:
// 'Abdulbasit_Abdussamad' -> 'Abdulbasit Abdussamad'
const formatReciterName = (folderName) => folderName.replace(/_/g, ' ');

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ══════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════

app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const result = stmt.run(username, hashedPassword);
        res.status(201).json({ message: 'User created successfully', id: result.lastInsertRowid });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE'))) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) return res.status(400).json({ error: 'User not found' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
        res.json({ accessToken });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ══════════════════════════════════════════════
// AUDIO / RECITER ROUTES
// ══════════════════════════════════════════════

/**
 * GET /api/reciters
 * Returns a list of available reciters from the dataset directory.
 * Supports optional ?search= query for filtering.
 * Each reciter entry includes: { id: folderName, name: displayName }
 */
app.get('/api/reciters', (req, res) => {
    try {
        const searchQuery = (req.query.search || '').toLowerCase().trim();

        let reciters = fs.readdirSync(DATASET_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
                id: dirent.name,
                name: formatReciterName(dirent.name),
            }));

        // Filter by search query if provided
        if (searchQuery) {
            reciters = reciters.filter(r =>
                r.name.toLowerCase().includes(searchQuery) ||
                r.id.toLowerCase().includes(searchQuery)
            );
        }

        res.json({ reciters });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read dataset directory' });
    }
});

/**
 * GET /api/audio?reciter=...&surah=...&ayah=...
 * Returns a single Ayah MP3 file.
 * File naming schema: {pad3(surah)}{pad3(ayah)}.mp3
 * e.g. Surah 2, Ayah 255 -> 002255.mp3
 */
app.get('/api/audio', (req, res) => {
    const { reciter, surah, ayah } = req.query;

    if (!reciter || !surah || !ayah) {
        return res.status(400).json({ error: 'Missing required parameters: reciter, surah, ayah' });
    }

    const surahNum = parseInt(surah, 10);
    const ayahNum = parseInt(ayah, 10);

    if (isNaN(surahNum) || isNaN(ayahNum)) {
        return res.status(400).json({ error: 'surah and ayah must be valid integers' });
    }

    const filename = `${pad3(surahNum)}${pad3(ayahNum)}.mp3`;
    const filepath = path.join(DATASET_PATH, reciter, filename);

    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).json({ error: `File not found: ${filename}` });
    }
});

/**
 * GET /api/download?reciter=...&surah=...&startAyah=...&endAyah=...
 * Concatenates a range of Ayah MP3s using FFmpeg and sends the result.
 * Downloaded filename format: Surah_{N}_Ayahs_{start}-{end}_{ReciterName}.mp3
 */
app.get('/api/download', (req, res) => {
    const { reciter, surah, startAyah, endAyah } = req.query;

    if (!reciter || !surah || !startAyah || !endAyah) {
        return res.status(400).json({ error: 'Missing required parameters: reciter, surah, startAyah, endAyah' });
    }

    const surahNumber = parseInt(surah, 10);
    const sAyah = parseInt(startAyah, 10);
    const eAyah = parseInt(endAyah, 10);

    if (isNaN(surahNumber) || isNaN(sAyah) || isNaN(eAyah) || sAyah > eAyah || surahNumber < 1 || surahNumber > 114) {
        return res.status(400).json({ error: 'Invalid surah or ayah parameters' });
    }

    const timestamp = Date.now();
    const listFile = path.join(TEMP_DIR, `concat-${timestamp}.txt`);
    const outputFile = path.join(TEMP_DIR, `out-${timestamp}.mp3`);

    let listContent = '';
    for (let a = sAyah; a <= eAyah; a++) {
        const filepath = path.join(DATASET_PATH, reciter, `${pad3(surahNumber)}${pad3(a)}.mp3`);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: `Audio file not found for Ayah ${a} of Surah ${surahNumber}` });
        }
        listContent += `file '${filepath.replace(/\\/g, '/')}'\n`;
    }

    fs.writeFileSync(listFile, listContent);

    // Use the display name in the download filename
    const displayReciterName = formatReciterName(reciter);
    const downloadFilename = `Surah_${surahNumber}_Ayahs_${sAyah}-${eAyah}_${displayReciterName}.mp3`;

    const cleanup = () => {
        if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    };

    ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
            '-c', 'copy',
            '-metadata', `title=Surah ${surahNumber} Ayahs ${sAyah}-${eAyah}`,
            '-metadata', `artist=${displayReciterName}`,
            '-metadata', `album=Quran By Ear`,
        ])
        .save(outputFile)
        .on('end', () => {
            res.download(outputFile, downloadFilename, (err) => {
                cleanup();
            });
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            cleanup();
            if (!res.headersSent) {
                res.status(500).json({ error: 'Audio processing failed' });
            }
        });
});

// ══════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend server running at http://0.0.0.0:${PORT}`);
        console.log(`Serving dataset from: ${DATASET_PATH}`);
    });
}

module.exports = app;
