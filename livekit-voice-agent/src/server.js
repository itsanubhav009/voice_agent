require('dotenv').config();
const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const AgentSession = require('./agent');
const MetricsLogger = require('./metrics');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Store active agent sessions
const activeSessions = new Map();

// Create a new agent session
app.post('/session/create', (req, res) => {
  const { userId, sessionId } = req.body;
  
  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'userId and sessionId are required' });
  }
  
  // Create a token for Livekit
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: userId,
    }
  );
  token.addGrant({ roomJoin: true, room: sessionId });
  
  // Initialize metrics logger for this session
  const metricsLogger = new MetricsLogger(sessionId, userId);
  
  // Create a new agent session
  const agent = new AgentSession(sessionId, userId, metricsLogger);
  activeSessions.set(sessionId, agent);
  
  // Start the agent
  agent.initialize()
    .then(() => {
      console.log(`Agent session ${sessionId} initialized for user ${userId}`);
    })
    .catch(err => {
      console.error(`Failed to initialize agent session: ${err.message}`);
      activeSessions.delete(sessionId);
    });
  
  res.json({
    token: token.toJwt(),
    sessionId
  });
});

// End an agent session
app.post('/session/end', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  
  const agent = activeSessions.get(sessionId);
  if (!agent) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    await agent.end();
    activeSessions.delete(sessionId);
    res.json({ success: true, message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ error: `Failed to end session: ${err.message}` });
  }
});

// Get metrics for a session
app.get('/session/metrics/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const agent = activeSessions.get(sessionId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(agent.getMetrics());
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
