# Fox Voice Assistant

An interactive 3D voice assistant built with Three.js and Web Speech API. Features a dynamic space environment with planets, asteroids, and responsive wave visualizations.

## Prerequisites

- Node.js (version 14 or higher)
- Modern web browser with microphone support (Chrome recommended)
- Backend server running on port 8000 (for query processing)

## Setup

1. Clone the repository:
```bash
git clone git@github.com:shelwyn/fox.git
cd fox-frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
- Local development: http://localhost:3000
- Network access: http://<your-ip-address>:3000

## Using the Voice Assistant

1. Enter the document name you want to chat with in the input field
2. Click the "Start" button and allow microphone access when prompted
3. Say "fox" to activate the voice assistant
4. Ask your question when the blue wave appears
5. Wait for the response (yellow wave during processing, green wave while speaking)
6. The assistant will automatically return to listening mode (red wave)

## Features

- Immersive 3D space environment with planets and asteroids
- Dynamic wave visualizations that respond to voice states
- Speech recognition for hands-free interaction
- Text-to-speech response playback
- Cross-device access through network support

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Notes

- Make sure your backend server is running on http://localhost:8000 before using the voice assistant
- For best experience, use headphones to prevent audio feedback
- Microphone access is required for voice recognition functionality
