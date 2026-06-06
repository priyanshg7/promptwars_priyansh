import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/gemini/chat
// @desc    Prompt the Gemini model and return text response
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Please provide a text prompt.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API Key is not configured on the server.' });
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Use the fast and efficient gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log(`Querying Gemini with prompt: "${prompt.slice(0, 50)}..."`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    res.json({ text: responseText });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ 
      message: 'Failed to generate content from Gemini API.',
      error: err.message 
    });
  }
});

// @route   GET /api/gemini/status
// @desc    Check if Gemini API Key is configured
// @access  Private
router.get('/status', auth, (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({ configured: isConfigured });
});

export default router;
