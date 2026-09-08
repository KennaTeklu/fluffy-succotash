const express = require('express');
const cors = require('cors');
const { handleUpload, getBlob } = require('@vercel/blob/client');
const PptToText = require('ppt-to-text');

const app = express();

// Explicit CORS configuration to handle preflight
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-vercel-token', 'x-vercel-file-name'],
    optionsSuccessStatus: 204 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-vercel-token, x-vercel-file-name');
    res.sendStatus(204);
});

// Handle body parsing
app.use(express.json());

// Token endpoint for client-direct Blob upload
app.post('/api/upload/token', async (req, res) => {
    try {
        const body = req.body;
        console.log('Received token request:', body);
        
        const token = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: () => {
                // Optional: add auth check here
            },
            onUploadCompleted: async ({ blob }) => {
                console.log('Upload completed:', blob.url);
                try {
                    const blobData = await getBlob(blob.url);
                    const buffer = Buffer.from(await blobData.arrayBuffer());
                    console.log('File size:', buffer.length);
                    
                    const converter = new PptToText(buffer);
                    converter.extract((err, text) => {
                        if (err) {
                            console.error('Extraction error:', err);
                        } else {
                            console.log('Extracted text length:', text.length);
                            // Here you could store the text in DB or send it back
                        }
                    });
                } catch (error) {
                    console.error('Processing error:', error);
                }
            }
        });
        res.json(token);
    } catch (error) {
        console.error('Token endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Simple test route
app.get('/api/extract', (req, res) => {
    res.json({ message: 'API is running. Use POST /api/upload/token' });
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

module.exports = app;
