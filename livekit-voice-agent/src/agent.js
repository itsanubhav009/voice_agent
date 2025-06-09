const { Room, RoomEvent, LocalParticipant } = require('livekit-client');
const STTService = require('./services/stt');
const LLMService = require('./services/llm');
const TTSService = require('./services/tts');

class AgentSession {
  constructor(sessionId, userId, metricsLogger) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.metricsLogger = metricsLogger;
    this.room = null;
    this.isListening = false;
    this.isProcessing = false;
    this.stt = new STTService();
    this.llm = new LLMService();
    this.tts = new TTSService();
    
    // Conversation context for the LLM
    this.conversationContext = [];
  }
  
  async initialize() {
    // Connect to the Livekit room
    this.room = new Room();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Connect to the room
    await this.room.connect(process.env.LIVEKIT_WS_URL, this.sessionId);
    
    // Publish agent's audio track
    await this.publishAgentTrack();
    
    console.log(`Agent connected to room: ${this.sessionId}`);
    
    // Start listening for user audio
    this.startListening();
  }
  
  setupEventListeners() {
    // Handle room events
    this.room.on(RoomEvent.ParticipantConnected, participant => {
      console.log(`Participant connected: ${participant.identity}`);
    });
    
    this.room.on(RoomEvent.ParticipantDisconnected, participant => {
      console.log(`Participant disconnected: ${participant.identity}`);
    });
    
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === 'audio' && participant.identity === this.userId) {
        // This is the user's audio track, process it
        this.handleUserAudio(track);
      }
    });
    
    // Handle interruptions
    this.room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
      if (speakers.some(speaker => speaker.identity === this.userId) && this.isProcessing) {
        // User is speaking while agent is processing - handle interruption
        this.handleInterruption();
      }
    });
  }
  
  async publishAgentTrack() {
    // This would create an audio track for the agent's responses
    // In a real implementation, we'd create an audio track and publish it
    // For now, we'll just log this
    console.log('Agent audio track published');
  }
  
  startListening() {
    this.isListening = true;
    console.log('Agent is now listening');
  }
  
  stopListening() {
    this.isListening = false;
    console.log('Agent stopped listening');
  }
  
  async handleUserAudio(audioTrack) {
    if (!this.isListening) return;
    
    // Start timing for metrics
    const startTime = Date.now();
    this.metricsLogger.startProcessing();
    
    try {
      // Process audio with STT
      this.isProcessing = true;
      const sttStartTime = Date.now();
      const transcription = await this.stt.transcribe(audioTrack);
      const sttEndTime = Date.now();
      this.metricsLogger.logSTTLatency(sttEndTime - sttStartTime);
      
      if (!transcription || transcription.trim() === '') return;
      
      // Check for end-of-utterance
      this.metricsLogger.logEOUDelay(sttEndTime - startTime);
      
      // Update conversation context
      this.conversationContext.push({ role: 'user', content: transcription });
      
      // Process with LLM
      const llmStartTime = Date.now();
      const llmResponse = await this.llm.generateResponse(this.conversationContext);
      const llmEndTime = Date.now();
      this.metricsLogger.logLLMLatency(llmEndTime - llmStartTime);
      this.metricsLogger.logTTFB(llmEndTime - startTime);
      
      // Update conversation context
      this.conversationContext.push({ role: 'assistant', content: llmResponse });
      
      // Convert to speech
      const ttsStartTime = Date.now();
      const audioData = await this.tts.synthesize(llmResponse);
      const ttsEndTime = Date.now();
      this.metricsLogger.logTTSLatency(ttsEndTime - ttsStartTime);
      
      // Play audio to the user
      await this.playAudioToUser(audioData);
      
      // Total latency
      const totalLatency = Date.now() - startTime;
      this.metricsLogger.logTotalLatency(totalLatency);
      this.metricsLogger.logTTFT(totalLatency);
      
    } catch (error) {
      console.error('Error processing user audio:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  async handleInterruption() {
    // Handle user interruption during agent's response
    console.log('User interrupted, stopping current processing');
    
    // Stop current processing
    this.isProcessing = false;
    
    // Log interruption
    this.metricsLogger.logInterruption();
    
    // Additional logic for gracefully handling the interruption
    // This could include stopping TTS playback, etc.
  }
  
  async playAudioToUser(audioData) {
    // In a real implementation, this would send the audio to the Livekit track
    // For now, we'll just log this
    console.log('Playing audio response to user');
  }
  
  getMetrics() {
    return this.metricsLogger.getMetrics();
  }
  
  async end() {
    // Stop listening
    this.stopListening();
    
    // Disconnect from the room
    if (this.room) {
      await this.room.disconnect();
    }
    
    // Save metrics to Excel file
    await this.metricsLogger.saveToExcel();
    
    console.log(`Agent session ${this.sessionId} ended`);
  }
}

module.exports = AgentSession;
