# WhatsApp Web Proxy Server

A self-hosted Node.js service that exposes WhatsApp Web automation via a REST API using `whatsapp-web.js`. This allows ViraReach to authenticate and manage WhatsApp accounts through QR code scanning.

## Features

- **QR Code Generation**: Generate real WhatsApp Web QR codes for authentication
- **Session Management**: Create, validate, and disconnect WhatsApp sessions
- **Status Polling**: Check connection status in real-time
- **Chat Access**: Verify connection by listing chats

## Prerequisites

1. Node.js 18+ installed
2. A server with persistent storage (for session data)

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start on port 3000 (or `PORT` environment variable).

## Deployment

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository or upload the `whatsapp-web-proxy` folder
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `PORT=3000`
6. Deploy!

### Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Deploy from GitHub or upload the folder
3. Railway will auto-detect Node.js and deploy
4. Copy the public URL

### Deploy to VPS (Ubuntu)

```bash
# Clone or upload the whatsapp-web-proxy folder
cd whatsapp-web-proxy

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Chromium dependencies (required for whatsapp-web.js)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Install dependencies
npm install

# Run with PM2 for production
npm install -g pm2
pm2 start index.js --name whatsapp-proxy
pm2 save
pm2 startup
```

## API Endpoints

### Health Check
```
GET /
```
Returns server status and active session count.

### Generate QR Code
```
POST /generateQR
```
Starts a new WhatsApp session and returns a QR code for scanning.

**Response:**
```json
{
  "success": true,
  "sessionId": "wa_1234567890_abc123",
  "qrCode": "data:image/png;base64,...",
  "state": "qr_ready"
}
```

### Check Session Status
```
GET /status/:sessionId
```
Returns the current status of a session.

**Response:**
```json
{
  "success": true,
  "sessionId": "wa_1234567890_abc123",
  "state": "connected",
  "phoneNumber": "1234567890",
  "pushName": "John Doe"
}
```

**States:**
- `initializing` - Session starting up
- `qr_ready` - QR code ready to scan
- `scanning` - QR scanned, authenticating
- `connected` - Fully connected
- `failed` - Connection failed
- `disconnected` - Session disconnected

### Validate Session
```
POST /validateSession
Body: { "sessionId": "wa_..." }
```
Checks if an existing session is still valid and connected.

### Get Chats
```
POST /getChats
Body: { "sessionId": "wa_...", "limit": 10 }
```
Returns a list of chats to verify the connection works.

### Disconnect Session
```
POST /disconnect/:sessionId
```
Disconnects and removes a session.

## Security Notes

- **Deploy behind HTTPS** - Always use HTTPS in production
- **Add authentication** - Consider adding API key authentication for production
- **Firewall rules** - Restrict access to your Supabase edge functions only
- **Session limits** - The server auto-cleans stale sessions after 30 minutes

## Troubleshooting

### "Failed to launch browser"
Install Chromium dependencies (see VPS deployment section).

### "Session timeout"
Increase the QR code wait timeout or check server resources.

### "QR code not appearing"
Check server logs for Puppeteer errors. May need more memory/CPU.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |

## License

MIT
