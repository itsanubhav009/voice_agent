require('dotenv').config();
const express = require('express');
const { AccessToken } = require('livekit-server-sdk'); // AccessToken is for generating tokens
const AgentSession = require('./agent');
const MetricsLogger = require('./metrics');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Store active agent sessions
const activeSessions = new Map();

// Validate essential environment variables
if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_WS_URL) {
  console.error('Missing critical LiveKit environment variables. Please check your .env file:');
  console.error(`LIVEKIT_API_KEY: ${process.env.LIVEKIT_API_KEY ? 'Set ✓' : 'Missing ✗'}`);
  console.error(`LIVEKIT_API_SECRET: ${process.env.LIVEKIT_API_SECRET ? 'Set ✓' : 'Missing ✗'}`);
  console.error(`LIVEKIT_WS_URL: ${process.env.LIVEKIT_WS_URL ? 'Set ✓' : 'Missing ✗'}`);
  process.exit(1);
}


// Create a new agent session
app.post('/session/create', (req, res) => {
  const { userId, sessionId } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'userId and sessionId are required' });
  }

  // Create a token for the client user to join the Livekit room
  const clientToken = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId, // Client's identity
      name: userId,     // Client's display name
    }
  );
  clientToken.addGrant({ roomJoin: true, room: sessionId });

  // Create a token for the Agent to join the Livekit room
  const agentIdentity = `agent_${sessionId}`; // Unique identity for the agent
  const agentToken = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: agentIdentity,
      name: 'Voice Agent', // Agent's display name
    }
  );
  // Grant necessary permissions for the agent
  agentToken.addGrant({
    roomJoin: true,
    room: sessionId,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    hidden: true, // Optionally hide the agent in participant lists
  });
  const agentJwtToken = agentToken.toJwt();

  // Initialize metrics logger for this session
  const metricsLogger = new MetricsLogger(sessionId, userId);

  // Create a new agent session, passing the agent's token and WS URL
  const agent = new AgentSession(sessionId, userId, metricsLogger, agentJwtToken, process.env.LIVEKIT_WS_URL);
  activeSessions.set(sessionId, agent);

  // Start the agent
  agent.initialize()
    .then(() => {
      console.log(`Agent session ${sessionId} initialized for user ${userId}`);
    })
    .catch(err => {
      console.error(`Failed to initialize agent session for room ${sessionId}: ${err.message}`);
      console.error(err.stack); // Log the full stack trace for better debugging
      activeSessions.delete(sessionId);
    });

  res.json({
    token: clientToken.toJwt(), // Return the client's token
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
    console.error(`Failed to end session ${sessionId}: ${err.message}`);
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