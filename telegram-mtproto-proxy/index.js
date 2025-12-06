import express from 'express';
import cors from 'cors';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Helper to create a temporary client
async function createClient(apiId, apiHash, sessionString) {
  const session = new StringSession(sessionString || '');
  const client = new TelegramClient(session, parseInt(apiId), apiHash, {
    connectionRetries: 3,
    useWSS: false,
  });
  await client.connect();
  return client;
}

// Helper to format user data
function formatUser(user) {
  if (!user) return null;
  
  return {
    user_id: user.id?.toString() || '',
    username: user.username || '',
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    phone: user.phone || '',
    bio: user.about || '',
    is_premium: user.premium || false,
    is_verified: user.verified || false,
    is_bot: user.bot || false,
    is_scam: user.scam || false,
    is_fake: user.fake || false,
    restricted: user.restricted || false,
    restriction_reason: user.restrictionReason || null,
    profile_photo: user.photo ? true : false,
    last_seen: user.status?.wasOnline ? new Date(user.status.wasOnline * 1000).toISOString() : null,
    last_seen_status: getLastSeenStatus(user.status),
  };
}

function getLastSeenStatus(status) {
  if (!status) return 'unknown';
  
  const className = status.className;
  if (className === 'UserStatusOnline') return 'online';
  if (className === 'UserStatusRecently') return 'recently';
  if (className === 'UserStatusLastWeek') return 'within_week';
  if (className === 'UserStatusLastMonth') return 'within_month';
  if (className === 'UserStatusOffline') {
    const wasOnline = status.wasOnline;
    if (!wasOnline) return 'offline';
    const now = Date.now() / 1000;
    const diff = now - wasOnline;
    if (diff < 300) return 'online'; // 5 min
    if (diff < 3600) return 'recently'; // 1 hour
    if (diff < 86400) return 'today';
    if (diff < 604800) return 'within_week';
    if (diff < 2592000) return 'within_month';
    return 'long_time_ago';
  }
  return 'hidden';
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ViraReach Telegram MTProto Proxy',
    version: '1.0.0',
    endpoints: ['/getParticipants', '/getContacts', '/getChats', '/getLastSeen', '/generateSession', '/validateSession']
  });
});

// Get group/channel participants
app.post('/getParticipants', async (req, res) => {
  const { apiId, apiHash, sessionString, groupLink, limit = 200 } = req.body;
  
  if (!apiId || !apiHash || !sessionString) {
    return res.status(400).json({ error: 'Missing required credentials: apiId, apiHash, sessionString' });
  }
  
  if (!groupLink) {
    return res.status(400).json({ error: 'Missing groupLink parameter' });
  }

  let client;
  try {
    console.log(`[getParticipants] Connecting to Telegram...`);
    client = await createClient(apiId, apiHash, sessionString);
    
    // Resolve the group/channel
    console.log(`[getParticipants] Resolving group: ${groupLink}`);
    let entity;
    
    // Handle different link formats
    let identifier = groupLink;
    if (groupLink.includes('t.me/')) {
      identifier = groupLink.split('t.me/')[1].split('/')[0].replace('+', '');
    } else if (groupLink.includes('telegram.me/')) {
      identifier = groupLink.split('telegram.me/')[1].split('/')[0];
    }
    
    // Try to get entity
    try {
      entity = await client.getEntity(identifier);
    } catch (e) {
      // Try with @ prefix for usernames
      if (!identifier.startsWith('@') && !identifier.startsWith('+')) {
        entity = await client.getEntity('@' + identifier);
      } else {
        throw e;
      }
    }
    
    console.log(`[getParticipants] Found entity: ${entity.className} - ${entity.title || entity.username}`);
    
    // Get participants
    const participants = [];
    let offset = 0;
    const batchSize = Math.min(limit, 200);
    
    while (participants.length < limit) {
      const result = await client.invoke(
        new Api.channels.GetParticipants({
          channel: entity,
          filter: new Api.ChannelParticipantsRecent(),
          offset,
          limit: batchSize,
          hash: BigInt(0),
        })
      );
      
      if (!result.users || result.users.length === 0) break;
      
      for (const user of result.users) {
        if (participants.length >= limit) break;
        const formatted = formatUser(user);
        if (formatted) participants.push(formatted);
      }
      
      offset += result.users.length;
      if (result.users.length < batchSize) break;
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`[getParticipants] Extracted ${participants.length} participants`);
    
    await client.disconnect();
    res.json({ 
      success: true, 
      count: participants.length,
      participants,
      group: {
        id: entity.id?.toString(),
        title: entity.title,
        username: entity.username,
        participantsCount: entity.participantsCount
      }
    });
    
  } catch (error) {
    console.error('[getParticipants] Error:', error.message);
    if (client) await client.disconnect().catch(() => {});
    res.status(500).json({ 
      error: error.message,
      errorType: error.constructor.name 
    });
  }
});

// Get user's contacts
app.post('/getContacts', async (req, res) => {
  const { apiId, apiHash, sessionString, phonePrefix, countryCode } = req.body;
  
  if (!apiId || !apiHash || !sessionString) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  let client;
  try {
    console.log(`[getContacts] Connecting to Telegram...`);
    client = await createClient(apiId, apiHash, sessionString);
    
    const result = await client.invoke(new Api.contacts.GetContacts({ hash: BigInt(0) }));
    
    let contacts = (result.users || []).map(formatUser).filter(Boolean);
    
    // Apply filters if provided
    if (phonePrefix) {
      contacts = contacts.filter(c => c.phone && c.phone.startsWith(phonePrefix));
    }
    if (countryCode) {
      contacts = contacts.filter(c => c.phone && c.phone.startsWith(countryCode));
    }
    
    console.log(`[getContacts] Retrieved ${contacts.length} contacts`);
    
    await client.disconnect();
    res.json({ success: true, count: contacts.length, contacts });
    
  } catch (error) {
    console.error('[getContacts] Error:', error.message);
    if (client) await client.disconnect().catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// Get user's chats/dialogs
app.post('/getChats', async (req, res) => {
  const { apiId, apiHash, sessionString, limit = 100, archived = false } = req.body;
  
  if (!apiId || !apiHash || !sessionString) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  let client;
  try {
    console.log(`[getChats] Connecting to Telegram...`);
    client = await createClient(apiId, apiHash, sessionString);
    
    const dialogs = await client.getDialogs({ limit, archived });
    
    const chats = dialogs.map(dialog => ({
      id: dialog.id?.toString(),
      name: dialog.name || dialog.title || '',
      type: dialog.isGroup ? 'group' : dialog.isChannel ? 'channel' : 'user',
      unreadCount: dialog.unreadCount || 0,
      lastMessage: dialog.message?.message?.substring(0, 100) || '',
      lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000).toISOString() : null,
      participantsCount: dialog.entity?.participantsCount || null,
    }));
    
    console.log(`[getChats] Retrieved ${chats.length} chats`);
    
    await client.disconnect();
    res.json({ success: true, count: chats.length, chats });
    
  } catch (error) {
    console.error('[getChats] Error:', error.message);
    if (client) await client.disconnect().catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// Get last seen status for specific users
app.post('/getLastSeen', async (req, res) => {
  const { apiId, apiHash, sessionString, userIds } = req.body;
  
  if (!apiId || !apiHash || !sessionString) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid userIds array' });
  }

  let client;
  try {
    console.log(`[getLastSeen] Connecting to Telegram...`);
    client = await createClient(apiId, apiHash, sessionString);
    
    const results = [];
    
    for (const userId of userIds.slice(0, 100)) { // Limit to 100 users
      try {
        const user = await client.getEntity(userId);
        results.push(formatUser(user));
      } catch (e) {
        results.push({ user_id: userId, error: e.message });
      }
      await new Promise(r => setTimeout(r, 50)); // Rate limit protection
    }
    
    console.log(`[getLastSeen] Retrieved status for ${results.length} users`);
    
    await client.disconnect();
    res.json({ success: true, count: results.length, users: results });
    
  } catch (error) {
    console.error('[getLastSeen] Error:', error.message);
    if (client) await client.disconnect().catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// Validate session string
app.post('/validateSession', async (req, res) => {
  const { apiId, apiHash, sessionString } = req.body;
  
  if (!apiId || !apiHash || !sessionString) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  let client;
  try {
    console.log(`[validateSession] Validating session...`);
    client = await createClient(apiId, apiHash, sessionString);
    
    const me = await client.getMe();
    
    await client.disconnect();
    res.json({ 
      success: true, 
      valid: true,
      user: formatUser(me)
    });
    
  } catch (error) {
    console.error('[validateSession] Error:', error.message);
    if (client) await client.disconnect().catch(() => {});
    res.json({ 
      success: false, 
      valid: false,
      error: error.message 
    });
  }
});

// Interactive session generation endpoint (returns instructions)
app.get('/generateSession', (req, res) => {
  res.json({
    message: 'Session generation requires interactive login. Use the scripts below:',
    python: `
# Install: pip install telethon
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = YOUR_API_ID
api_hash = 'YOUR_API_HASH'

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("Your session string:")
    print(client.session.save())
`,
    nodejs: `
// Install: npm install telegram input
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

const apiId = YOUR_API_ID;
const apiHash = 'YOUR_API_HASH';
const session = new StringSession('');

const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

await client.start({
  phoneNumber: async () => await input.text('Phone number: '),
  password: async () => await input.text('2FA Password (if enabled): '),
  phoneCode: async () => await input.text('Code from Telegram: '),
  onError: (err) => console.log(err),
});

console.log('Your session string:');
console.log(client.session.save());
await client.disconnect();
`,
    instructions: [
      '1. Go to https://my.telegram.org/apps and create an application',
      '2. Copy your api_id and api_hash',
      '3. Run the Python or Node.js script above with your credentials',
      '4. Enter your phone number and the code Telegram sends you',
      '5. Copy the session string output',
      '6. Save it in ViraReach Account Manager'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ViraReach Telegram MTProto Proxy running on port ${PORT}`);
  console.log(`📡 Endpoints: /getParticipants, /getContacts, /getChats, /getLastSeen, /validateSession`);
});
