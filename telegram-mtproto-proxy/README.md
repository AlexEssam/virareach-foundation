# ViraReach Telegram MTProto Proxy

A self-hosted Node.js service that provides REST API access to Telegram's MTProto protocol using GramJS.

## Features

- ✅ Extract group/channel participants with full user data
- ✅ Get contacts with phone number filtering
- ✅ List chats and dialogs
- ✅ Check user last seen status
- ✅ Validate session strings
- ✅ Session generation scripts

## Prerequisites

1. **Telegram API Credentials**
   - Go to https://my.telegram.org/apps
   - Log in with your phone number
   - Create a new application
   - Copy your `api_id` and `api_hash`

2. **Session String**
   - Run the session generation script (see below)
   - Save the output string securely

## Quick Start

```bash
# Clone/download this folder
cd telegram-mtproto-proxy

# Install dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:3000` by default.

## Deployment

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repo or upload the code
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Copy your service URL (e.g., `https://your-app.onrender.com`)
5. Add it as `TELEGRAM_MTPROTO_PROXY_URL` secret in ViraReach

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy to VPS

```bash
# SSH into your server
ssh user@your-server.com

# Clone the repo
git clone <your-repo>
cd telegram-mtproto-proxy

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install dependencies and start
npm install
pm2 start index.js --name telegram-proxy
pm2 save
```

## Generate Session String

### Option 1: Python (Recommended)

```bash
pip install telethon
```

```python
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = 12345  # Your API ID
api_hash = 'your_api_hash'

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("Your session string:")
    print(client.session.save())
```

### Option 2: Node.js

```bash
npm install telegram input
```

```javascript
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

const apiId = 12345; // Your API ID
const apiHash = 'your_api_hash';
const session = new StringSession('');

const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => await input.text('Phone number: '),
  password: async () => await input.text('2FA Password: '),
  phoneCode: async () => await input.text('Code: '),
  onError: (err) => console.log(err),
});

console.log('Session string:', client.session.save());
await client.disconnect();
```

## API Endpoints

### GET /
Health check and list of available endpoints.

### POST /getParticipants
Extract members from a group or channel.

```json
{
  "apiId": "12345",
  "apiHash": "your_api_hash",
  "sessionString": "your_session_string",
  "groupLink": "https://t.me/your_group",
  "limit": 200
}
```

**Response:**
```json
{
  "success": true,
  "count": 150,
  "participants": [
    {
      "user_id": "123456789",
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "bio": "Hello world",
      "is_premium": true,
      "is_verified": false,
      "last_seen": "2024-01-15T10:30:00.000Z",
      "last_seen_status": "recently"
    }
  ],
  "group": {
    "id": "987654321",
    "title": "My Group",
    "participantsCount": 5000
  }
}
```

### POST /getContacts
Get user's saved contacts.

```json
{
  "apiId": "12345",
  "apiHash": "your_api_hash",
  "sessionString": "your_session_string",
  "phonePrefix": "+1",
  "countryCode": "1"
}
```

### POST /getChats
Get user's chats/dialogs.

```json
{
  "apiId": "12345",
  "apiHash": "your_api_hash",
  "sessionString": "your_session_string",
  "limit": 100,
  "archived": false
}
```

### POST /getLastSeen
Check last seen status for specific users.

```json
{
  "apiId": "12345",
  "apiHash": "your_api_hash",
  "sessionString": "your_session_string",
  "userIds": ["123456789", "987654321"]
}
```

### POST /validateSession
Validate a session string is still active.

```json
{
  "apiId": "12345",
  "apiHash": "your_api_hash",
  "sessionString": "your_session_string"
}
```

### GET /generateSession
Get instructions and scripts for generating a session string.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Keep session strings secret** - They grant full access to your Telegram account
2. **Use HTTPS** - Always deploy with SSL in production
3. **Rate limits** - Telegram limits ~300 requests/minute
4. **Account safety** - Excessive API usage may trigger restrictions
5. **Phone visibility** - Phone numbers are only visible if user's privacy settings allow

## Troubleshooting

### "PHONE_NUMBER_INVALID"
Make sure to include country code (e.g., +1234567890)

### "SESSION_REVOKED"
Generate a new session string - the old one has expired

### "FLOOD_WAIT_X"
Too many requests - wait X seconds before retrying

### "CHAT_ADMIN_REQUIRED"
You need admin rights to extract participants from this group

## License

MIT
