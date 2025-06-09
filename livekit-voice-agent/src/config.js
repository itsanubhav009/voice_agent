require('dotenv').config();

module.exports = {
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    wsUrl: process.env.LIVEKIT_WS_URL
  },
  stt: {
    provider: 'deepgram',
    apiKey: process.env.DEEPGRAM_API_KEY
  },
  llm: {
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-70b-8192'
  },
  tts: {
    provider: 'elevenlabs',
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  },
  server: {
    port: parseInt(process.env.PORT || '3000')
  }
};
