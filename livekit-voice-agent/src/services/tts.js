const ElevenLabs = require('elevenlabs-node');
const util = require('util'); // For more detailed logging

class TTSService {
  constructor() {
    this.voice = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
    this.apiKey = process.env.ELEVENLABS_API_KEY;

    console.log(`[TTSService] Constructor initialized.`);
    console.log(`[TTSService] Voice ID: ${this.voice} (Type: ${typeof this.voice})`);
    if (this.apiKey && typeof this.apiKey === 'string') {
        console.log(`[TTSService] API Key (first 5 chars): ${this.apiKey.substring(0, 5)}... (Type: ${typeof this.apiKey})`);
    } else {
        console.error(`[TTSService] CRITICAL: ElevenLabs API Key is NOT a string or is NOT SET. Value: ${this.apiKey}, Type: ${typeof this.apiKey}`);
    }
  }
  
  async synthesize(text) {
    console.log(`[TTSService] synthesize called with text (length: ${text.length}): "${text.substring(0, 100)}..."`); // Log only first 100 chars
    
    if (!this.apiKey || typeof this.apiKey !== 'string') {
      const errorMessage = '[TTSService] CRITICAL: ElevenLabs API Key is missing or not a string. Cannot proceed with TTS.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    if (!this.voice || typeof this.voice !== 'string') {
      const errorMessage = '[TTSService] CRITICAL: ElevenLabs Voice ID is missing or not a string. Cannot proceed with TTS.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const requestPayload = {
      apiKey: this.apiKey,
      voiceId: this.voice,
      textInput: text,
      modelId: 'eleven_turbo_v2', // Ensure this is a valid and desired model
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0, 
        use_speaker_boost: true
      },
      // outputFormat: 'mp3_44100_128' // Optional: specify output format if needed
    };

    console.log(`[TTSService] Calling ElevenLabs.textToSpeech with payload (API key redacted for logging):`, 
      JSON.parse(JSON.stringify({ ...requestPayload, apiKey: "REDACTED" })) // Deep clone and redact for logging
    );
    
    try {
      const audioResponse = await ElevenLabs.textToSpeech(requestPayload);
      
      // The elevenlabs-node library documentation suggests it returns an object like { data: Buffer, ... }
      // or throws an error.
      if (!audioResponse || !audioResponse.data || !(audioResponse.data instanceof Buffer) || audioResponse.data.length === 0) {
        console.error('[TTSService] ElevenLabs API call did not return audio data in the expected Buffer format or buffer is empty.');
        console.error('[TTSService] Received response from ElevenLabs.textToSpeech:', util.inspect(audioResponse, {depth: 2}));
        throw new Error('TTS synthesis failed to return valid audio data.');
      }
      
      console.log(`[TTSService] ElevenLabs API call successful. Audio data Buffer received (length: ${audioResponse.data.length}).`);
      return audioResponse.data; // Return the Buffer
    } catch (error) {
      console.error('[TTSService] Error during ElevenLabs.textToSpeech call:', error.message);
      if (error.response) { // Axios error object structure
        console.error(`[TTSService] ElevenLabs API Error Status: ${error.response.status}`);
        // Attempt to parse error data if it's a stream or buffer
        let errorDetails = 'Could not extract error details from response.';
        if (error.response.data) {
            if (Buffer.isBuffer(error.response.data)) {
                errorDetails = error.response.data.toString();
            } else if (typeof error.response.data.pipe === 'function') { // It's a stream
                 errorDetails = await new Promise((resolve) => {
                    let str = '';
                    error.response.data.on('data', chunk => str += chunk);
                    error.response.data.on('end', () => resolve(str));
                    error.response.data.on('error', (streamError) => resolve(`Error reading error stream: ${streamError.message}`));
                });
            } else {
                try {
                    errorDetails = JSON.stringify(error.response.data);
                } catch (e) {
                    errorDetails = util.inspect(error.response.data, {depth: 2});
                }
            }
        }
        console.error('[TTSService] ElevenLabs API Error Details:', errorDetails);
      } else {
        // Log the non-Axios error (e.g., validation error from the library itself)
        console.error('[TTSService] Non-API error during TTS:', util.inspect(error, {depth: 3}));
      }
      throw error; // Re-throw to be caught by AgentSession
    }
  }
}

module.exports = TTSService;