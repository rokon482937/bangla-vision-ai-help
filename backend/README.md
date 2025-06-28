
# Killer Assistant Backend API

This is the backend API server for the Killer Assistant AI Screen Share & Voice Assistant application.

## Features

- OpenAI GPT-4 integration for AI responses
- Firebase Firestore for user data and token management
- Bengali language support
- Token-based usage tracking
- Secure user authentication
- Real-time AI chat functionality

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
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: Server port (default: 3000)

### 3. Firebase Admin Setup

1. Go to your Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save the downloaded JSON file as `serviceAccountKey.json` in the backend folder

### 4. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

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

## Token System

- **Free Users**: Unlimited usage (no token deduction)
- **Pro Users**: Limited tokens, tracked per API call
- **Premium Users**: Unlimited usage (no token deduction)

Each AI interaction costs 10 tokens for Pro users.

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

## Monitoring

- Request logging
- Error tracking
- Token usage analytics
- User interaction history stored in Firestore

## Support

For issues and support, please check the Firebase Console logs and server console output for detailed error information.
