const crypto = require('crypto');
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '3010', 10);
const bridgeToken = process.env.BRIDGE_TOKEN || '';
const sessionPath = process.env.SESSION_PATH || path.join(__dirname, '.wwebjs_auth');
const maxImageBytes = 5 * 1024 * 1024;

let client = null;
let initializationPromise = null;
let state = 'disconnected';
let qr = null;
let pushname = null;

app.use(express.json({ limit: '8mb' }));

function status() {
  return { state, qr, pushname };
}

function tokenMatches(requestToken) {
  if (typeof requestToken !== 'string' || !bridgeToken) {
    return false;
  }

  const expected = Buffer.from(bridgeToken);
  const provided = Buffer.from(requestToken);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

function requireToken(request, response, next) {
  if (!tokenMatches(request.get('X-Bridge-Token'))) {
    return response.status(401).json({ message: 'Unauthorized.' });
  }

  return next();
}

function normalizeRecipient(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const digits = value.trim().replace(/@c\.us$/i, '').replace(/^\+/, '');
  return /^\d{8,15}$/.test(digits) ? `${digits}@c.us` : null;
}

function validBase64(value) {
  if (typeof value !== 'string' || !value || value.length % 4 === 1) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

async function initializeClient() {
  if (client || initializationPromise) {
    return;
  }

  const activeClient = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client = activeClient;

  activeClient.on('qr', async (value) => {
    if (client !== activeClient) {
      return;
    }
    state = 'qr';
    pushname = null;
    try {
      qr = await QRCode.toDataURL(value, { type: 'image/png' });
    } catch {
      qr = null;
    }
  });

  activeClient.on('authenticated', () => {
    if (client !== activeClient) {
      return;
    }
    state = 'authenticated';
    qr = null;
  });

  activeClient.on('ready', () => {
    if (client !== activeClient) {
      return;
    }
    state = 'ready';
    qr = null;
    pushname = activeClient.info && activeClient.info.pushname ? activeClient.info.pushname : null;
  });

  activeClient.on('auth_failure', () => {
    if (client !== activeClient) {
      return;
    }
    console.error('WhatsApp authentication failed.');
    state = 'disconnected';
    qr = null;
    pushname = null;
  });

  activeClient.on('disconnected', () => {
    if (client !== activeClient) {
      return;
    }
    state = 'disconnected';
    qr = null;
    pushname = null;
    client = null;
  });

  const initializePromise = activeClient.initialize()
    .catch((error) => {
      if (client !== activeClient) {
        return;
      }
      console.error('WhatsApp client initialization failed.', error.name || 'Error');
      state = 'disconnected';
      qr = null;
      pushname = null;
      client = null;
      return activeClient.destroy().catch(() => {});
    })
    .finally(() => {
      if (initializationPromise === initializePromise) {
        initializationPromise = null;
      }
    });
  initializationPromise = initializePromise;
}

app.use(requireToken);

app.get('/status', (request, response) => {
  response.json(status());
});

app.post('/login', async (request, response) => {
  await initializeClient();
  response.json(status());
});

app.post('/logout', async (request, response) => {
  const activeClient = client;
  client = null;
  initializationPromise = null;

  try {
    if (activeClient) {
      await activeClient.logout().catch(() => {});
      await activeClient.destroy().catch(() => {});
    }
    await fs.rm(sessionPath, { recursive: true, force: true });
  } catch {
    return response.status(503).json({ message: 'Unable to disconnect WhatsApp right now.' });
  } finally {
    state = 'disconnected';
    qr = null;
    pushname = null;
  }

  return response.json({ state: 'disconnected' });
});

app.post('/send', async (request, response) => {
  if (!client || state !== 'ready') {
    return response.status(503).json({ message: 'WhatsApp is not connected.' });
  }

  const recipient = normalizeRecipient(request.body && request.body.to);
  const text = typeof request.body?.text === 'string' ? request.body.text : null;
  const imageBase64 = typeof request.body?.imageBase64 === 'string' ? request.body.imageBase64 : null;
  const caption = typeof request.body?.caption === 'string' ? request.body.caption : null;

  if (!recipient || (!text && !imageBase64) || (imageBase64 && !validBase64(imageBase64))) {
    return response.status(422).json({ message: 'A valid recipient and message are required.' });
  }

  if (imageBase64) {
    const image = Buffer.from(imageBase64, 'base64');
    if (image.length > maxImageBytes) {
      return response.status(422).json({ message: 'The image is too large.' });
    }
  }

  try {
    const ids = [];
    if (text) {
      const message = await client.sendMessage(recipient, text);
      ids.push(message.id.id);
    }
    if (imageBase64) {
      const media = new MessageMedia('image/png', imageBase64, 'maibook-report.png');
      const message = await client.sendMessage(recipient, media, { caption: caption || undefined });
      ids.push(message.id.id);
    }

    return response.json({ sent: true, ids });
  } catch {
    return response.status(502).json({ message: 'WhatsApp could not send the message.' });
  }
});

app.use((request, response) => {
  response.status(404).json({ message: 'Not found.' });
});

app.use((error, request, response, next) => {
  response.status(400).json({ message: 'Invalid request.' });
});

app.listen(port, host, () => {
  process.stdout.write(`WhatsApp bridge listening on ${host}:${port}\n`);
});
