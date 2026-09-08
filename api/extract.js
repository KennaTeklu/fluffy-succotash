const express = require('express');
const cors = require('cors');
const { handleUpload, getBlob } = require('@vercel/blob/client');
const PptToText = require('ppt-to-text');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint that handles token generation and webhook callbacks
app.post('/api/upload/token', async (req, res) => {
    try {
        const body = req.body;
        const token = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: () => {
                // Optional: you can add authentication here
                // For now, allow all
            },
            onUploadCompleted: async ({ blob }) => {
                // This is called when the upload is complete
                // We process the file here
                try {
                    const blobData = await getBlob(blob.url);
                    const buffer = Buffer.from(await blobData.arrayBuffer());
                    const converter = new PptToText(buffer);
                    converter.extract((err, text) => {
                        if (err) {
                            console.error('Extraction error:', err);
                        } else {
                            // Here we could store the text or send it back to the client
                            // For now, just log it
                            console.log('Extracted text length:', text.length);
                        }
                    });
                } catch (error) {
                    console.error('Processing error:', error);
                }
            }
        });
        res.json(token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple test route (optional)
app.get('/api/extract', (req, res) => {
    res.json({ message: 'API is running. Use POST /api/upload/token' });
});

module.exports = app;
