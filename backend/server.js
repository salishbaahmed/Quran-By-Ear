const cp = require('child_process');
const originalSpawn = cp.spawn;
cp.spawn = function(command, args, options) {
    options = options || {};
    options.windowsHide = true;
    return originalSpawn(command, args, options);
};

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
const multer = require('multer');
const mp3Duration = require('mp3-duration');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}
const upload = multer({ dest: TEMP_DIR });

const DATASET_PATH = process.env.DATASET_PATH || 'C:\\Users\\SAA\\Documents\\Quran';
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'quran-by-ear-dev-secret';

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

    const addPrefix = (prefixName) => {
        const prefixPath = path.join(DATASET_PATH, reciter, prefixName);
        if (fs.existsSync(prefixPath)) {
            listContent += `file '${prefixPath.replace(/\\/g, '/')}'\n`;
        }
    };

    if (sAyah === 1) {
        if (surahNumber === 1 || surahNumber === 9) {
            addPrefix('audhubillah.mp3');
        } else {
            const abPath = path.join(DATASET_PATH, reciter, 'Audhubillah_Bismillah.mp3');
            if (fs.existsSync(abPath)) {
                addPrefix('Audhubillah_Bismillah.mp3');
            } else {
                addPrefix('bismillah.mp3');
            }
        }
    } else {
        addPrefix('audhubillah.mp3');
    }

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
        // NOTE: fluent-ffmpeg splits option strings on spaces, so metadata
        // values with spaces (e.g. reciter display names) must use the raw
        // underscore form to avoid FFmpeg treating the second word as the output file.
        .outputOptions(['-c', 'copy'])
        .addOption('-metadata', `title=Surah_${surahNumber}_Ayahs_${sAyah}-${eAyah}`)
        .addOption('-metadata', `artist=${reciter}`)
        .addOption('-metadata', 'album=QuranByEar')
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

/**
 * GET /api/audio/timings?reciter=...&surah=...&startAyah=...&endAyah=...
 * Returns an array of timestamps (start, end, duration) for each Ayah in the generated file.
 */
app.get('/api/audio/timings', async (req, res) => {
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

    const timings = [];
    let currentStartTime = 0;

    const getDuration = async (prefixName) => {
        const prefixPath = path.join(DATASET_PATH, reciter, prefixName);
        if (fs.existsSync(prefixPath)) {
            const duration = await mp3Duration(prefixPath);
            currentStartTime += duration;
        }
    };

    try {
        if (sAyah === 1) {
            if (surahNumber === 1 || surahNumber === 9) {
                await getDuration('audhubillah.mp3');
            } else {
                const abPath = path.join(DATASET_PATH, reciter, 'Audhubillah_Bismillah.mp3');
                if (fs.existsSync(abPath)) {
                    await getDuration('Audhubillah_Bismillah.mp3');
                } else {
                    await getDuration('bismillah.mp3');
                }
            }
        } else {
            await getDuration('audhubillah.mp3');
        }

        for (let a = sAyah; a <= eAyah; a++) {
            const filepath = path.join(DATASET_PATH, reciter, `${pad3(surahNumber)}${pad3(a)}.mp3`);
            if (!fs.existsSync(filepath)) {
                return res.status(404).json({ error: `Audio file not found for Ayah ${a} of Surah ${surahNumber}` });
            }
            const duration = await mp3Duration(filepath);
            timings.push({
                ayah: a,
                start: currentStartTime,
                end: currentStartTime + duration,
                duration
            });
            currentStartTime += duration;
        }

        res.json({ timings });
    } catch (err) {
        console.error('Timings error:', err);
        res.status(500).json({ error: 'Failed to calculate audio timings' });
    }
});

/**
 * POST /api/video/transcode
 * Receives a .webm blob and transcodes it to .mp4 using native FFmpeg.
 */
app.post('/api/video/transcode', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}_out.mp4`;

    ffmpeg(inputPath)
        .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-c:a', 'aac'
        ])
        .save(outputPath)
        .on('end', () => {
            res.download(outputPath, 'generated_video.mp4', (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });
        })
        .on('error', (err) => {
            console.error('Transcode error:', err);
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Transcoding failed' });
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
