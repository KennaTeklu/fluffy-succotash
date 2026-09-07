const express = require('express');
const multer = require('multer');
const cors = require('cors');
const PptToText = require('ppt-to-text');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/extract', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const converter = new PptToText(req.file.buffer);
        converter.extract((err, text) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ text });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = app;
