const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store active sessions
const sessions = new Map();

// Session states
const SESSION_STATES = {
  INITIALIZING: 'initializing',
  QR_READY: 'qr_ready',
  SCANNING: 'scanning',
  CONNECTED: 'connected',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected'
};

// Generate unique session ID
function generateSessionId() {
  return 'wa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'WhatsApp Web Proxy',
    activeSessions: sessions.size 
  });
});

// Generate QR code and start new session
app.post('/generateQR', async (req, res) => {
  const sessionId = generateSessionId();
  
  console.log(`[${sessionId}] Starting new session...`);
  
  try {
    const session = {
      id: sessionId,
      state: SESSION_STATES.INITIALIZING,
      qrCode: null,
      phoneNumber: null,
      client: null,
      createdAt: Date.now(),
      error: null
    };
    
    sessions.set(sessionId, session);

    // Create WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    session.client = client;

    // QR Code event
    client.on('qr', async (qr) => {
      console.log(`[${sessionId}] QR code received`);
      try {
        const qrDataUrl = await qrcode.toDataURL(qr, { width: 256 });
        session.qrCode = qrDataUrl;
        session.state = SESSION_STATES.QR_READY;
      } catch (err) {
        console.error(`[${sessionId}] QR generation error:`, err);
        session.error = 'Failed to generate QR code';
        session.state = SESSION_STATES.FAILED;
      }
    });

    // Authenticated event (QR scanned, loading)
    client.on('authenticated', () => {
      console.log(`[${sessionId}] Authenticated - scanning complete`);
      session.state = SESSION_STATES.SCANNING;
    });

    // Ready event (fully connected)
    client.on('ready', async () => {
      console.log(`[${sessionId}] Client ready`);
      session.state = SESSION_STATES.CONNECTED;
      
      try {
        const info = client.info;
        session.phoneNumber = info.wid.user;
        session.pushName = info.pushname;
        console.log(`[${sessionId}] Connected as: ${session.phoneNumber} (${session.pushName})`);
      } catch (err) {
        console.error(`[${sessionId}] Error getting client info:`, err);
      }
    });

    // Auth failure
    client.on('auth_failure', (msg) => {
      console.error(`[${sessionId}] Auth failure:`, msg);
      session.state = SESSION_STATES.FAILED;
      session.error = 'Authentication failed';
    });

    // Disconnected
    client.on('disconnected', (reason) => {
      console.log(`[${sessionId}] Disconnected:`, reason);
      session.state = SESSION_STATES.DISCONNECTED;
    });

    // Initialize client
    client.initialize();

    // Wait for QR code (max 30 seconds)
    let attempts = 0;
    const maxAttempts = 60;
    
    while (session.state === SESSION_STATES.INITIALIZING && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (session.qrCode) {
      res.json({
        success: true,
        sessionId: sessionId,
        qrCode: session.qrCode,
        state: session.state
      });
    } else if (session.state === SESSION_STATES.FAILED) {
      res.status(500).json({
        success: false,
        error: session.error || 'Failed to initialize session'
      });
    } else {
      res.status(504).json({
        success: false,
        error: 'Timeout waiting for QR code'
      });
    }
  } catch (error) {
    console.error(`[${sessionId}] Error:`, error);
    sessions.delete(sessionId);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check session status
app.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    sessionId: sessionId,
    state: session.state,
    phoneNumber: session.phoneNumber,
    pushName: session.pushName,
    qrCode: session.state === SESSION_STATES.QR_READY ? session.qrCode : null,
    error: session.error
  });
});

// Validate existing session
app.post('/validateSession', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID required'
    });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.json({
      success: true,
      valid: false,
      reason: 'Session not found'
    });
  }

  const isValid = session.state === SESSION_STATES.CONNECTED && session.client;
  
  res.json({
    success: true,
    valid: isValid,
    state: session.state,
    phoneNumber: session.phoneNumber
  });
});

// Get chats (to verify connection works)
app.post('/getChats', async (req, res) => {
  const { sessionId, limit = 10 } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID required'
    });
  }

  const session = sessions.get(sessionId);

  if (!session || session.state !== SESSION_STATES.CONNECTED) {
    return res.status(400).json({
      success: false,
      error: 'Session not connected'
    });
  }

  try {
    const chats = await session.client.getChats();
    const chatList = chats.slice(0, limit).map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount
    }));

    res.json({
      success: true,
      chats: chatList,
      total: chats.length
    });
  } catch (error) {
    console.error(`[${sessionId}] Error getting chats:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect session
app.post('/disconnect/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  try {
    if (session.client) {
      await session.client.destroy();
    }
    sessions.delete(sessionId);
    
    console.log(`[${sessionId}] Session disconnected and removed`);
    
    res.json({
      success: true,
      message: 'Session disconnected'
    });
  } catch (error) {
    console.error(`[${sessionId}] Error disconnecting:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cleanup old sessions periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.state !== SESSION_STATES.CONNECTED && (now - session.createdAt) > maxAge) {
      console.log(`[${sessionId}] Cleaning up stale session`);
      if (session.client) {
        session.client.destroy().catch(() => {});
      }
      sessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`WhatsApp Web Proxy running on port ${PORT}`);
});
