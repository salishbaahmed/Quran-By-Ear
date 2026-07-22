require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const db = require('./database');
const app = express();

app.use(cors());
app.use(express.json());

const DATASET_PATH = process.env.DATASET_PATH || 'B:\\Quran';
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const TEMP_DIR = path.join(__dirname, 'temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Helper
const pad3 = (num) => String(num).padStart(3, '0');

// Auth Middleware
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

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'User created successfully', id: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'User not found' });

        if (await bcrypt.compare(password, user.password)) {
            const accessToken = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
            res.json({ accessToken });
        } else {
            res.status(400).json({ error: 'Invalid password' });
        }
    });
});

// --- AUDIO ROUTES ---

app.get('/api/reciters', authenticateToken, (req, res) => {
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

// Download & Concatenate MP3
app.get('/api/download', authenticateToken, (req, res) => {
    const { reciter, surah, startAyah, endAyah } = req.query;
    
    if (!reciter || !surah || !startAyah || !endAyah) {
        return res.status(400).json({ error: 'Missing required parameters: reciter, surah, startAyah, endAyah' });
    }

    const sAyah = parseInt(startAyah);
    const eAyah = parseInt(endAyah);
    
    if (sAyah > eAyah) {
        return res.status(400).json({ error: 'startAyah must be <= endAyah' });
    }

    const timestamp = Date.now();
    const listFile = path.join(TEMP_DIR, `concat-${timestamp}.txt`);
    const outputFile = path.join(TEMP_DIR, `out-${timestamp}.mp3`);
    
    let listContent = '';
    for (let a = sAyah; a <= eAyah; a++) {
        const filepath = path.join(DATASET_PATH, reciter, `${pad3(surah)}${pad3(a)}.mp3`);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: `File not found for Ayah ${a}` });
        }
        // FFMPEG requires forward slashes and absolute paths in single quotes
        listContent += `file '${filepath.replace(/\\/g, '/')}'\n`;
    }

    fs.writeFileSync(listFile, listContent);

    const downloadFilename = `Surah_${surah}_Ayahs_${startAyah}-${endAyah}_${reciter}.mp3`;

    ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
            '-c', 'copy', // Stream copy for speed (no re-encoding)
            `-metadata`, `title=Surah ${surah} Ayahs ${startAyah}-${endAyah}`,
            `-metadata`, `artist=${reciter}`,
            `-metadata`, `album=Quran By Ear`
        ])
        .save(outputFile)
        .on('end', () => {
            res.download(outputFile, downloadFilename, (err) => {
                // Cleanup temp files
                if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            });
        })
        .on('error', (err) => {
            console.error('FFMPEG Error:', err);
            if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
            res.status(500).json({ error: 'Audio processing failed' });
        });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
