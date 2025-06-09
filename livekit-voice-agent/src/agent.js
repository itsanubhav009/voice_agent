// Polyfill for WebRTC APIs, WebSocket, and navigator if running in Node.js
// This entire block should be at the very top of the file, before any other imports or code.
if (typeof global !== 'undefined') {
    console.log('[POLYFILL_INIT] Starting polyfill setup for Node.js environment.');

    // WebRTC Polyfills
    if (typeof global.RTCPeerConnection === 'undefined') {
        console.log('[POLYFILL_WRTC] Attempting to polyfill WebRTC globals...');
        try {
            const wrtc = require('wrtc');
            global.RTCPeerConnection = wrtc.RTCPeerConnection;
            global.RTCSessionDescription = wrtc.RTCSessionDescription;
            global.RTCIceCandidate = wrtc.RTCIceCandidate;
            global.MediaStream = wrtc.MediaStream;
            global.MediaStreamTrack = wrtc.MediaStreamTrack;

            if (wrtc.RTCRtpReceiver) global.RTCRtpReceiver = wrtc.RTCRtpReceiver;
            if (wrtc.RTCRtpSender) global.RTCRtpSender = wrtc.RTCRtpSender;
            if (wrtc.RTCStatsReport) global.RTCStatsReport = wrtc.RTCStatsReport;

            console.log('[POLYFILL_WRTC] Successfully polyfilled WebRTC globals (RTCPeerConnection, RTCStatsReport, etc.).');

            // Patch RTCRtpReceiver.prototype.getStats
            if (global.RTCRtpReceiver && global.RTCRtpReceiver.prototype) {
                console.log('[POLYFILL_WRTC] Found global.RTCRtpReceiver.prototype.');
                if (typeof global.RTCRtpReceiver.prototype.getStats === 'function') {
                    console.log(`[POLYFILL_WRTC] Original RTCRtpReceiver.prototype.getStats type: ${typeof global.RTCRtpReceiver.prototype.getStats}. Patching...`);
                    global.RTCRtpReceiver.prototype.getStats = function() {
                        console.log('[GS_Rcv_Patch]'); 
                        return Promise.resolve(new Map());
                    };
                    console.log('[POLYFILL_WRTC] Patched RTCRtpReceiver.prototype.getStats successfully.');
                } else {
                    console.warn('[POLYFILL_WRTC] RTCRtpReceiver.prototype.getStats is not a function or not found. Cannot patch.');
                }
            } else {
                console.warn('[POLYFILL_WRTC] global.RTCRtpReceiver or its prototype not found for getStats patch.');
            }

            // Patch RTCRtpSender.prototype.getStats
            if (global.RTCRtpSender && global.RTCRtpSender.prototype) {
                console.log('[POLYFILL_WRTC] Found global.RTCRtpSender.prototype.');
                if (typeof global.RTCRtpSender.prototype.getStats === 'function') {
                    console.log(`[POLYFILL_WRTC] Original RTCRtpSender.prototype.getStats type: ${typeof global.RTCRtpSender.prototype.getStats}. Patching...`);
                    global.RTCRtpSender.prototype.getStats = function() {
                        console.log('[GS_Snd_Patch]'); 
                        return Promise.resolve(new Map());
                    };
                    console.log('[POLYFILL_WRTC] Patched RTCRtpSender.prototype.getStats successfully.');
                } else {
                    console.warn('[POLYFILL_WRTC] RTCRtpSender.prototype.getStats is not a function or not found. Cannot patch.');
                }
            } else {
                console.warn('[POLYFILL_WRTC] global.RTCRtpSender or its prototype not found for getStats patch.');
            }

        } catch (err) {
            console.error('[POLYFILL_WRTC] CRITICAL: Failed to load or polyfill wrtc. Ensure wrtc is installed.', err);
        }
    } else {
        console.log('[POLYFILL_WRTC] WebRTC globals (RTCPeerConnection) seem to be already defined.');
    }

    // WebSocket Polyfill
    if (typeof global.WebSocket === 'undefined') {
        console.log('[POLYFILL_WS] Attempting to polyfill WebSocket...');
        try {
            global.WebSocket = require('ws');
            console.log('[POLYFILL_WS] Successfully polyfilled global.WebSocket with ws module.');
        } catch (err) {
            console.error('[POLYFILL_WS] CRITICAL: Failed to load ws for WebSocket polyfill. Ensure ws is installed.', err);
        }
    } else {
        console.log('[POLYFILL_WS] WebSocket seems to be already defined.');
    }

    // Navigator Polyfill
    if (typeof global.navigator === 'undefined') {
        console.log('[POLYFILL_NAV] Attempting to polyfill navigator...');
        global.navigator = {
            userAgent: 'NodeJS Voice Agent/1.0 (Polyfilled)',
            mediaDevices: {
                getUserMedia: async () => { 
                    console.warn('[POLYFILL_NAV] navigator.mediaDevices.getUserMedia CALLED (polyfilled, throws error).');
                    throw new Error("getUserMedia is not implemented in this Node.js agent polyfill"); 
                },
                enumerateDevices: async () => { 
                    console.warn('[POLYFILL_NAV] navigator.mediaDevices.enumerateDevices CALLED (polyfilled, returns empty array).');
                    return []; 
                }
            }
        };
        console.log('[POLYFILL_NAV] Successfully polyfilled global.navigator.');
    } else if (typeof global.navigator.mediaDevices === 'undefined') {
        console.log('[POLYFILL_NAV] global.navigator exists, attempting to polyfill mediaDevices...');
        global.navigator.mediaDevices = {
            getUserMedia: async () => { 
                console.warn('[POLYFILL_NAV] navigator.mediaDevices.getUserMedia CALLED on existing navigator (polyfilled, throws error).');
                throw new Error("getUserMedia is not implemented in this Node.js agent polyfill"); 
            },
            enumerateDevices: async () => { 
                console.warn('[POLYFILL_NAV] navigator.mediaDevices.enumerateDevices CALLED on existing navigator (polyfilled, returns empty array).');
                return []; 
            }
        };
        console.log('[POLYFILL_NAV] Successfully polyfilled navigator.mediaDevices on existing navigator object.');
    } else {
        console.log('[POLYFILL_NAV] Navigator and navigator.mediaDevices seem to be already defined.');
    }
    console.log('[POLYFILL_INIT] Polyfill setup for Node.js environment completed.');
}

// Log before livekit-client is imported to check patch status
console.log('[AGENT_SETUP] About to import livekit-client. Current state of RTCRtpReceiver.prototype.getStats:', 
    (typeof global !== 'undefined' && global.RTCRtpReceiver && global.RTCRtpReceiver.prototype) ? 
    (global.RTCRtpReceiver.prototype.getStats && global.RTCRtpReceiver.prototype.getStats.toString().includes("[GS_Rcv_Patch]") ? 
     "Exists and appears to be patched." : 
     (global.RTCRtpReceiver.prototype.getStats ? "Exists but NOT patched." : "undefined")
    ) : 
    "RTCRtpReceiver or prototype not defined globally."
);

const { Room, RoomEvent, LocalParticipant, createLocalAudioTrack, Track, RoomState } = require('livekit-client');
const STTService = require('./services/stt');
const LLMService = require('./services/llm');
const TTSService = require('./services/tts');

console.log('[AGENT_SETUP] livekit-client imported successfully.');

class AgentSession {
  constructor(sessionId, userId, metricsLogger, agentToken, livekitWsUrl) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.metricsLogger = metricsLogger;
    this.agentToken = agentToken;
    this.livekitWsUrl = livekitWsUrl;
    this.room = null;
    this.isListening = false;
    this.isProcessing = false;
    this.agentAudioTrack = null; 

    console.log(`[AgentSession] CONSTRUCTOR for session ${sessionId}, user ${userId}. Initializing services...`);
    try {
        this.stt = new STTService(); 
        this.llm = new LLMService(); 
        this.tts = new TTSService(); 
    } catch (e) {
        console.error(`[AgentSession] CRITICAL_ERROR in CONSTRUCTOR: Failed to initialize services: ${e.message}`, e.stack);
        throw e; 
    }
    this.conversationContext = [];
    console.log(`[AgentSession] CONSTRUCTOR completed for session ${sessionId}.`);
  }

  async initialize() {
    console.log(`\n\n[AGENT_LIFECYCLE] INITIALIZE start for session ${this.sessionId}.\n\n`);
    if (!this.livekitWsUrl || typeof this.livekitWsUrl !== 'string') {
        console.error('[AgentSession] CRITICAL_ERROR: LiveKit WebSocket URL is missing or invalid during initialize.');
        throw new Error('LiveKit WebSocket URL is missing or invalid in AgentSession.');
    }
    if (!this.agentToken || typeof this.agentToken !== 'string') {
        console.error('[AgentSession] CRITICAL_ERROR: Agent token is missing or invalid during initialize.');
        throw new Error('Agent token is missing or invalid in AgentSession.');
    }

    this.room = new Room({
        adaptiveStream: false, 
        dynacast: false,       
    });
    console.log(`[AgentSession] Room object created for ${this.sessionId}.`);
    
    this.setupEventListeners();
    
    console.log(`[AgentSession] Attempting to connect to room: ${this.sessionId} at ${this.livekitWsUrl}`);
    try {
        await this.room.connect(this.livekitWsUrl, this.agentToken, { autoSubscribe: true });
        console.log(`\n\n[AGENT_LIFECYCLE] SUCCESSFULLY CONNECTED to room: ${this.sessionId}. Room SID: ${this.room.sid}, Local Participant SID: ${this.room.localParticipant.sid}\n\n`);
        
        // ***** CORRECTED ORDER: Call startListening() AFTER successful connection, BEFORE other async operations like publishAgentTrack *****
        this.startListening(); 
        // ***** END CORRECTION *****

        await this.publishAgentTrack(); 
        
        console.log(`[AgentSession] INITIALIZE completed for session ${this.sessionId}. Agent is listening (publishAgentTrack attempted).`);
    } catch (error) {
        console.error(`[AgentSession] CRITICAL_ERROR: Failed during initialize sequence for room ${this.sessionId}:`, error.message);
        console.error(`[AgentSession] Error stack: ${error.stack}`);
        this.stopListening(); 
        if (this.room && this.room.state !== RoomState.Disconnected) {
            await this.room.disconnect();
        }
        throw error; 
    }
  }

  setupEventListeners() {
    console.log(`\n[AGENT_SETUP] Setting up event listeners for room ${this.sessionId}\n`);
    
    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log(`\n\n[AGENT_EVENT] Event: Participant connected: ${participant.identity} (SID: ${participant.sid}) in room ${this.room.name}\n\n`);
    });
    
    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log(`\n\n[AGENT_EVENT] Event: Participant disconnected: ${participant.identity} (SID: ${participant.sid}) from room ${this.room.name}\n\n`);
    });
    
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log(`\n\n[AGENT_EVENT] Event: Track subscribed. Kind: ${track.kind}, Name: ${track.name}, Track SID: ${track.sid}, Participant: ${participant.identity} (SID: ${participant.sid})\n\n`);
      if (track.kind === Track.Kind.Audio && participant.identity === this.userId) {
        console.log(`\n\n[AGENT_EVENT] ---> Subscribed to DESIGNATED USER's (${this.userId}) audio track: ${track.sid}. Attaching listener for data.\n\n`);
        this.handleUserAudio(track);
      } else {
        console.log(`[AgentSession] Subscribed to a track, but it's not the designated user's audio or not audio. Kind: ${track.kind}, Participant: ${participant.identity}`);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log(`[AgentSession] Event: Track UNsubscribed. Kind: ${track.kind}, Name: ${track.name}, Track SID: ${track.sid}, Participant: ${participant.identity}`);
    });

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIdentities = speakers.map(s => s.identity);
      console.log(`[AgentSession] Event: Active speakers changed: ${speakerIdentities.join(', ')}`);
      if (this.isListening && this.isProcessing && speakers.some(speaker => speaker.identity === this.userId)) {
        console.log(`[AgentSession] User ${this.userId} started speaking while agent was processing. Handling interruption.`);
        this.handleInterruption();
      }
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
        console.log(`[AgentSession] Event: DISCONNECTED from room ${this.sessionId}. Reason: ${reason}`);
        this.stopListening();
    });

    this.room.on(RoomEvent.Reconnecting, () => {
        console.log(`[AgentSession] Event: Attempting to RECONNECT to room ${this.sessionId}...`);
        this.stopListening(); 
    });

    this.room.on(RoomEvent.Reconnected, () => {
        console.log(`[AgentSession] Event: RECONNECTED to room ${this.sessionId}.`);
        this.startListening(); 
        if (this.agentAudioTrack && !this.room.localParticipant.getTrackPublication(this.agentAudioTrack.source)) {
            console.log('[AgentSession] Agent audio track seems unpublished after reconnect. Attempting to re-publish.');
            this.publishAgentTrack().catch(err => console.error('[AgentSession] Error re-publishing agent track after reconnect:', err));
        }
    });
    console.log(`[AgentSession] Event listeners setup completed for room ${this.sessionId}`);
  }
  
  async publishAgentTrack() {
    console.log('[AgentSession] publishAgentTrack called.');
    if (!this.room || this.room.state !== RoomState.Connected) {
        console.warn('[AgentSession] publishAgentTrack: Room is not connected. Skipping publish.');
        return;
    }
    try {
        if (typeof global.MediaStreamTrack === 'undefined' || typeof global.RTCPeerConnection === 'undefined') {
             console.error('[AgentSession] CRITICAL_ERROR: MediaStreamTrack or RTCPeerConnection not polyfilled. Cannot create dummy track.');
             throw new Error('WebRTC polyfills for track creation are missing.');
        }

        console.log('[AgentSession] Attempting to create a local audio track without getUserMedia...');
        this.agentAudioTrack = await createLocalAudioTrack({
            name: 'agent-tts-output',
        });

        if (!this.agentAudioTrack) {
            console.error('[AgentSession] CRITICAL_ERROR: createLocalAudioTrack returned null or undefined.');
            throw new Error('Failed to create agent audio track.');
        }
        
        console.log(`[AgentSession] Dummy agent audio track created (SID: ${this.agentAudioTrack.sid}, Kind: ${this.agentAudioTrack.kind}, Source: ${this.agentAudioTrack.source}). Attempting to publish...`);
        
        if (!this.room.localParticipant) {
            console.error('[AgentSession] CRITICAL_ERROR: localParticipant is null, cannot publish track.');
            throw new Error('LocalParticipant not available for publishing track.');
        }

        await this.room.localParticipant.publishTrack(this.agentAudioTrack, {
            name: 'agent-tts-output',
            source: Track.Source.Synthesized 
        });
        console.log(`[AgentSession] Agent audio track (SID: ${this.agentAudioTrack.sid}) PUBLISHED successfully.`);

    } catch (error) {
        console.error('[AgentSession] CRITICAL_ERROR during publishAgentTrack:', error.message);
        console.error(error.stack); 
    }
  }
  
  startListening() {
    if (this.room && this.room.state === RoomState.Connected) {
        this.isListening = true;
        console.log(`[AgentSession] Agent is now LISTENING for user ${this.userId} in room ${this.sessionId}`);
    } else {
        console.warn(`[AgentSession] startListening called, but room is not connected (state: ${this.room ? this.room.state : 'null'}). Not setting isListening to true yet.`);
        this.isListening = false;
    }
  }
  
  stopListening() {
    this.isListening = false;
    console.log(`[AgentSession] Agent STOPPED LISTENING in room ${this.sessionId}`);
  }
  
  async handleUserAudio(audioTrack) {
    console.log(`\n\n>>>>>>>>>> [AGENT_PIPELINE] handleUserAudio CALLED for track SID: ${audioTrack.sid}, Name: ${audioTrack.name}, Kind: ${audioTrack.kind}. <<<<<<<<<<\n\n`);
    
    if (!this.room || this.room.state !== RoomState.Connected) {
        console.warn(`[AgentSession] handleUserAudio: Room not connected (state: ${this.room ? this.room.state : 'null'}). Ignoring user audio.`);
        return;
    }
    if (!this.isListening) {
        console.log('[AgentSession] Not listening (isListening=false), ignoring user audio. Agent might still be initializing or explicitly stopped.');
        return;
    }

    if (this.isProcessing) {
        console.log('[AgentSession] Already processing, ignoring concurrent user audio. (User might be interrupting)');
        return; 
    }
    
    console.log(`[AgentSession] ---> Handling user audio from ${this.userId}. Starting processing pipeline...`);
    this.isProcessing = true;
    const startTime = Date.now();
    this.metricsLogger.startProcessing();
    
    try {
      console.log('[AgentSession] Step 1: Transcribing audio with STTService...');
      const sttStartTime = Date.now();
      const transcription = await this.stt.transcribe(audioTrack); 
      const sttEndTime = Date.now();
      this.metricsLogger.logSTTLatency(sttEndTime - sttStartTime);
      console.log(`[AgentSession] STT completed in ${sttEndTime - sttStartTime}ms. Transcription: "${transcription}"`);
      
      if (!transcription || transcription.trim() === '') {
        console.log('[AgentSession] STT returned empty/null transcription. Ending current processing cycle.');
        this.isProcessing = false;
        return;
      }
      
      this.metricsLogger.logEOUDelay(sttEndTime - startTime); 
      this.conversationContext.push({ role: 'user', content: transcription });
      console.log(`[AgentSession] Conversation context updated with user message. Current context length: ${this.conversationContext.length}`);
      
      console.log('[AgentSession] Step 2: Generating response with LLMService...');
      const llmStartTime = Date.now();
      const llmResponse = await this.llm.generateResponse(this.conversationContext);
      const llmEndTime = Date.now();
      this.metricsLogger.logLLMLatency(llmEndTime - llmStartTime);
      this.metricsLogger.logTTFB(llmEndTime - startTime); 
      console.log(`[AgentSession] LLM completed in ${llmEndTime - llmStartTime}ms. Response: "${llmResponse}"`);
      
      if (!llmResponse || llmResponse.trim() === '') {
        console.log('[AgentSession] LLM returned empty/null response. Ending current processing cycle.');
        this.isProcessing = false;
        return;
      }

      this.conversationContext.push({ role: 'assistant', content: llmResponse });
      console.log(`[AgentSession] Conversation context updated with assistant message. Current context length: ${this.conversationContext.length}`);
      
      console.log('[AgentSession] Step 3: Synthesizing audio with TTSService...');
      const ttsStartTime = Date.now();
      const audioData = await this.tts.synthesize(llmResponse); 
      const ttsEndTime = Date.now();
      this.metricsLogger.logTTSLatency(ttsEndTime - ttsStartTime);
      console.log(`[AgentSession] TTS completed in ${ttsEndTime - ttsStartTime}ms. Audio data received: ${audioData ? 'Yes (Buffer length: ' + audioData.length +')' : 'No'}`);
      
      if (audioData && audioData.length > 0) {
        await this.playAudioToUser(audioData);
      } else {
        console.log('[AgentSession] No valid audio data from TTS to play.');
      }
      
      const totalLatency = Date.now() - startTime;
      this.metricsLogger.logTotalLatency(totalLatency);
      this.metricsLogger.logTTFT(totalLatency); 
      console.log(`[AgentSession] ---> Full processing pipeline for user input took ${totalLatency}ms.`);
      
    } catch (error) {
      console.error('[AgentSession] CRITICAL_ERROR processing user audio in handleUserAudio:', error.message);
      console.error(`[AgentSession] Error stack: ${error.stack}`);
    } finally {
      this.isProcessing = false;
      console.log('[AgentSession] Finished processing user audio cycle. Ready for next input.');
    }
  }
  
  async handleInterruption() {
    console.log('[AgentSession] User INTERRUPTED agent. Stopping current TTS playback (if any) and clearing processing state.');
    if (this.agentAudioTrack && typeof this.agentAudioTrack.stop === 'function') {
        console.log('[AgentSession] Placeholder: Would stop agentAudioTrack here.');
    }
    
    this.isProcessing = false; 
    this.metricsLogger.logInterruption();
    console.log('[AgentSession] Interruption handling complete.');
  }
  
  async playAudioToUser(audioData) {
    console.log('[AgentSession] playAudioToUser called.');
    if (!this.agentAudioTrack) {
        console.error('[AgentSession] CRITICAL_ERROR: Cannot play audio to user, agentAudioTrack is not available/published.');
        return;
    }
    if (audioData && audioData.length > 0) {
        console.log(`[AgentSession] Placeholder: Playing audio response to user (simulated). Audio data (Buffer length: ${audioData.length}) received.`);
        console.log('[AgentSession] playAudioToUser: Actual audio playback to LiveKit track is NOT YET IMPLEMENTED.');
    } else {
        console.log('[AgentSession] No valid audio data from TTS to play in playAudioToUser.');
    }
  }
  
  getMetrics() {
    console.log('[AgentSession] getMetrics called.');
    return this.metricsLogger.getMetrics();
  }
  
  async end() {
    console.log(`[AgentSession] ENDING session ${this.sessionId}...`);
    this.stopListening();
    
    if (this.room) {
      console.log(`[AgentSession] Disconnecting from room ${this.room.name} (SID: ${this.room.sid})`);
      await this.room.disconnect();
      console.log(`[AgentSession] Successfully disconnected from room ${this.sessionId}.`);
    } else {
      console.log(`[AgentSession] Room object not found for session ${this.sessionId}, cannot disconnect.`);
    }
    
    try {
        await this.metricsLogger.saveToExcel();
    } catch (err) {
        console.error(`[AgentSession] Failed to save metrics for session ${this.sessionId}: ${err.message}`, err.stack);
    }
    
    console.log(`[AgentSession] Session ${this.sessionId} processing ENDED.`);
  }
}

module.exports = AgentSession;