
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Whisper transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Processing audio file:', req.file.filename);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check token limits for paid users
    if (userData.subscription !== 'free' && userData.subscription !== 'premium') {
      const remainingTokens = userData.tokens - userData.usedTokens;
      if (remainingTokens <= 0) {
        fs.unlinkSync(req.file.path);
        return res.status(429).json({ error: 'Token limit exceeded' });
      }
    }

    // Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'bn', // Bengali language
      response_format: 'text',
      temperature: 0.2
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('Transcription result:', transcription);

    // Update token usage for paid users (smaller cost for transcription)
    if (userData.subscription !== 'free' && userData.subscription !== 'premium') {
      await db.collection('users').doc(userId).update({
        usedTokens: admin.firestore.FieldValue.increment(2)
      });
    }

    // Log the transcription
    await db.collection('transcriptions').add({
      userId: userId,
      transcript: transcription,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      tokensUsed: userData.subscription === 'free' || userData.subscription === 'premium' ? 0 : 2
    });

    res.json({ transcript: transcription });
  } catch (error) {
    console.error('Whisper transcription error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// AI Chat endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check token limits for paid users
    if (userData.subscription !== 'free' && userData.subscription !== 'premium') {
      const remainingTokens = userData.tokens - userData.usedTokens;
      if (remainingTokens <= 0) {
        return res.status(429).json({ error: 'Token limit exceeded' });
      }
    }

    // Enhanced system prompt for better Bengali support and screen assistance
    const systemPrompt = `You are Killer Assistant, an advanced AI that helps users solve problems they encounter on their screen. 

Key capabilities:
- Provide solutions in Bengali (বাংলা) language when the user speaks Bengali
- Provide solutions in English when the user speaks English
- Help with technical issues, software problems, and general questions
- Give step-by-step instructions
- Be concise but helpful and actionable
- Understand context from screen sharing scenarios

User context: The user is screen sharing and asking for help via voice (transcribed using Whisper). Respond in the same language as the user's question. Provide practical, actionable solutions.

Keep responses under 200 words for better text-to-speech experience.`;

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;
    
    if (!reply) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Update token usage for paid users only
    if (userData.subscription !== 'free' && userData.subscription !== 'premium') {
      await db.collection('users').doc(userId).update({
        usedTokens: admin.firestore.FieldValue.increment(8)
      });
    }

    // Log the interaction
    await db.collection('ai_interactions').add({
      userId: userId,
      prompt: prompt,
      response: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      tokensUsed: userData.subscription === 'free' || userData.subscription === 'premium' ? 0 : 8
    });

    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Something went wrong with the AI service' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Token status endpoint
app.get('/api/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    res.json({
      totalTokens: userData.tokens,
      usedTokens: userData.usedTokens,
      remainingTokens: userData.tokens - userData.usedTokens,
      subscription: userData.subscription
    });
  } catch (error) {
    console.error('Token status error:', error);
    res.status(500).json({ error: 'Failed to get token status' });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Killer Assistant API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Whisper transcription: http://localhost:${PORT}/api/transcribe`);
  console.log(`🤖 AI chat: http://localhost:${PORT}/api/ask`);
});

module.exports = app;
