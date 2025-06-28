
# Killer Assistant Backend API

This is the backend API server for the Killer Assistant AI Screen Share & Voice Assistant application.

## Features

- OpenAI GPT-4 integration for AI responses
- OpenAI Whisper integration for voice transcription
- Firebase Firestore for user data and token management
- Bengali and English language support
- Token-based usage tracking
- Secure user authentication
- Real-time AI chat functionality
- Audio file processing and transcription

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key (must have access to GPT-4 and Whisper)
   - `PORT`: Server port (default: 3000)

### 3. Firebase Admin Setup

1. Go to your Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save the downloaded JSON file as `serviceAccountKey.json` in the backend folder

### 4. Create Uploads Directory

The server will automatically create an `uploads/` directory for temporary audio files.

### 5. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### POST /api/transcribe
- **Description**: Transcribe audio using OpenAI Whisper
- **Content-Type**: multipart/form-data
- **Body**: 
  - `audio`: Audio file (WebM, MP3, WAV, etc.)
  - `userId`: Firebase user ID
- **Response**: 
  ```json
  {
    "transcript": "Transcribed text here"
  }
  ```

### POST /api/ask
- **Description**: Send a prompt to the AI and get a response
- **Body**: 
  ```json
  {
    "prompt": "Your question here",
    "userId": "firebase_user_id"
  }
  ```
- **Response**: 
  ```json
  {
    "reply": "AI response here"
  }
  ```

### GET /api/tokens/:userId
- **Description**: Get user's token status
- **Response**: 
  ```json
  {
    "totalTokens": 1000,
    "usedTokens": 150,
    "remainingTokens": 850,
    "subscription": "pro"
  }
  ```

### GET /health
- **Description**: Health check endpoint
- **Response**: 
  ```json
  {
    "status": "OK",
    "timestamp": "2023-12-07T10:30:00.000Z"
  }
  ```

## Security Features

- Firebase Admin SDK for secure user authentication
- Token validation for API requests
- User-specific token tracking
- Firestore security rules integration
- Automatic cleanup of uploaded audio files

## Token System

- **Free Users**: Unlimited usage (no token deduction)
- **Pro Users**: Limited tokens, tracked per API call
  - Transcription: 2 tokens per request
  - AI Chat: 8 tokens per request
- **Premium Users**: Unlimited usage (no token deduction)

## Audio Processing

- Supports various audio formats (WebM, MP3, WAV, M4A)
- Maximum file size: 25MB
- Optimized for Bengali language recognition
- Automatic file cleanup after processing

## Deployment

### Using PM2 (Recommended for production)

```bash
npm install -g pm2
pm2 start server.js --name "killer-assistant-api"
pm2 startup
pm2 save
```

### Using Docker

```bash
docker build -t killer-assistant-api .
docker run -p 3000:3000 --env-file .env killer-assistant-api
```

## Error Handling

The API includes comprehensive error handling for:
- Invalid API keys
- Rate limiting
- Token exhaustion
- Firebase connectivity issues
- OpenAI API errors
- Audio processing errors
- File upload errors

## Monitoring

- Request logging
- Error tracking
- Token usage analytics
- User interaction history stored in Firestore
- Transcription logs for debugging

## Support

For issues and support, please check the Firebase Console logs and server console output for detailed error information.

## Requirements

- Node.js 16+
- OpenAI API key with GPT-4 and Whisper access
- Firebase project with Firestore enabled
- Sufficient disk space for temporary audio file processing
```
