const ElevenLabs = require('elevenlabs-node');

class TTSService {
  constructor() {
    // Initialize ElevenLabs client correctly
    this.voice = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Rachel voice as default
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }
  
  async synthesize(text) {
    try {
      // Use the correct API pattern for elevenlabs-node
      const audioData = await ElevenLabs.textToSpeech({
        apiKey: this.apiKey,
        voiceId: this.voice,
        textInput: text,
        modelId: 'eleven_turbo_v2',
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });
      
      return audioData;
    } catch (error) {
      console.error('TTS Error:', error);
      throw error;
    }
  }
}

module.exports = TTSService;